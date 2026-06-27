const { metaWebhookVerifyToken } = require('../_lib/config');
const { normalizePhone } = require('../_lib/phone');
const { sendRsvpConfirmed, sendRsvpDeclined, sendCardCountSelection } = require('../_lib/meta');
const { getGuestByPhone, getGuestByMetaMessageId, updateGuest, insertMessage, logTimeline, logWebhookEvent } = require('../_lib/supabase');

function send(res, status, body, contentType = 'text/plain; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', contentType);
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

function extractButtonText(message) {
  if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
    return [
      message.interactive.button_reply.id,
      message.interactive.button_reply.title
    ].filter(Boolean).join(' ');
  }
  if (message.type === 'button') {
    return [message.button?.payload, message.button?.text].filter(Boolean).join(' ');
  }
  return '';
}

function mapButtonId(message) {
  const raw = extractButtonText(message);
  const text = normalizeText(raw);
  if (!text) return '';

  if (
    text.includes('decline') ||
    text.includes('declined') ||
    text.includes('btn_decline') ||
    text.includes('اعتذر') ||
    text.includes('معتذر') ||
    text.includes('عذر') ||
    text.includes('لا استطيع')
  ) return 'btn_decline';

  if (
    text.includes('confirm') ||
    text.includes('confirmed') ||
    text.includes('btn_confirm') ||
    text.includes('ارغب') ||
    text.includes('حضور') ||
    text.includes('ساحضر') ||
    text.includes('سأحضر')
  ) return 'btn_confirm';

  return 'btn_unknown';
}

async function findGuestForMessage(phoneNumber, contextMessageId) {
  let guest = null;
  if (contextMessageId) guest = await getGuestByMetaMessageId(contextMessageId);
  if (!guest) guest = await getGuestByPhone(phoneNumber);
  return guest;
}

async function recordOutboundConfirmation(guest, phoneNumber, status, result) {
  await insertMessage({
    bookingId: guest.bookingId,
    guestId: guest.id,
    phoneNumber,
    direction: 'outbound',
    messageType: 'template_or_text',
    messageBody: status === 'confirmed' ? 'رسالة تأكيد الحضور' : 'رسالة تأكيد الاعتذار',
    metaMessageId: result?.messageId || null,
    status: result?.status || 'failed'
  });
}

async function processButton(message) {
  const phoneNumber = normalizePhone(message.from || message.contacts?.[0]?.wa_id);
  const buttonId = mapButtonId(message);
  const contextMessageId = message.context?.id;

  await logWebhookEvent('rsvp_button_received', {
    from: message.from,
    phoneNumber,
    messageType: message.type,
    rawButton: extractButtonText(message),
    buttonId,
    contextMessageId
  });

  if (!phoneNumber || !buttonId || buttonId === 'btn_unknown') return { handled: false, reason: 'unknown_button' };

  const guest = await findGuestForMessage(phoneNumber, contextMessageId);
  await logWebhookEvent('rsvp_guest_lookup', { phoneNumber, buttonId, contextMessageId, found: !!guest, guestId: guest?.id || null });
  if (!guest) return { handled: false, reason: 'guest_not_found' };

  const cardsCount = Number(guest.cardsCount || 1);
  const repliedAt = new Date().toISOString();

  if (buttonId === 'btn_decline') {
    await updateGuest(guest.id, {
      rsvpStatus: 'declined',
      confirmedCount: 0,
      declinedCount: cardsCount,
      pendingCount: 0,
      repliedAt
    });
    await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'button', messageBody: 'أعتذر عن الحضور', status: 'received' });
    await logTimeline(guest, 'rsvp_declined', { cardsCount }, 'meta');
    const result = await sendRsvpDeclined(phoneNumber);
    await recordOutboundConfirmation(guest, phoneNumber, 'declined', result);
    await logWebhookEvent('rsvp_declined_done', { guestId: guest.id, phoneNumber, confirmation: result });
    return { handled: true, status: 'declined', confirmation: result };
  }

  if (buttonId === 'btn_confirm' && cardsCount > 1) {
    await updateGuest(guest.id, {
      rsvpStatus: 'pending',
      pendingCount: cardsCount,
      repliedAt
    });
    await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'button', messageBody: 'أرغب في الحضور - بانتظار عدد البطاقات', status: 'received' });
    await logTimeline(guest, 'rsvp_confirm_requested_count', { cardsCount }, 'meta');
    const result = await sendCardCountSelection(phoneNumber, guest.guestName, cardsCount);
    await recordOutboundConfirmation(guest, phoneNumber, 'confirmed', result);
    await logWebhookEvent('rsvp_count_selection_sent', { guestId: guest.id, phoneNumber, result });
    return { handled: true, status: 'awaiting_count', confirmation: result };
  }

  await updateGuest(guest.id, {
    rsvpStatus: 'confirmed',
    confirmedCount: 1,
    declinedCount: 0,
    pendingCount: 0,
    repliedAt
  });
  await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'button', messageBody: 'أرغب في الحضور', status: 'received' });
  await logTimeline(guest, 'rsvp_confirmed', { confirmedCount: 1 }, 'meta');
  const result = await sendRsvpConfirmed(phoneNumber);
  await recordOutboundConfirmation(guest, phoneNumber, 'confirmed', result);
  await logWebhookEvent('rsvp_confirmed_done', { guestId: guest.id, phoneNumber, confirmation: result });
  return { handled: true, status: 'confirmed', confirmation: result };
}

async function processListReply(message) {
  if (!(message.type === 'interactive' && message.interactive?.type === 'list_reply')) return { handled: false };
  const phoneNumber = normalizePhone(message.from);
  const selectedId = message.interactive.list_reply.id || '';
  const match = selectedId.match(/card_count_(\d+)/);
  if (!match) return { handled: false, reason: 'unknown_list_reply' };

  const selectedCount = Number(match[1]);
  const guest = await findGuestForMessage(phoneNumber, message.context?.id);
  await logWebhookEvent('card_count_selected', { phoneNumber, selectedId, selectedCount, found: !!guest, guestId: guest?.id || null });
  if (!guest) return { handled: false, reason: 'guest_not_found' };

  const cardsCount = Number(guest.cardsCount || 1);
  const confirmedCount = Math.max(0, Math.min(selectedCount, cardsCount));
  const declinedCount = Math.max(0, cardsCount - confirmedCount);

  await updateGuest(guest.id, {
    rsvpStatus: 'confirmed',
    confirmedCount,
    declinedCount,
    pendingCount: 0,
    repliedAt: new Date().toISOString()
  });
  await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'list_reply', messageBody: `تأكيد ${confirmedCount} من ${cardsCount}`, status: 'received' });
  await logTimeline(guest, 'rsvp_confirmed_count', { confirmedCount, declinedCount, cardsCount }, 'meta');
  const result = await sendRsvpConfirmed(phoneNumber);
  await recordOutboundConfirmation(guest, phoneNumber, 'confirmed', result);
  await logWebhookEvent('rsvp_count_confirmed_done', { guestId: guest.id, phoneNumber, confirmation: result });
  return { handled: true, status: 'confirmed', confirmation: result };
}

async function processStatus(status) {
  const messageId = status.id;
  const phoneNumber = normalizePhone(status.recipient_id);
  let guest = await getGuestByMetaMessageId(messageId);
  if (!guest) guest = await getGuestByPhone(phoneNumber);
  if (!guest) return;

  const updates = {};
  const current = guest.rsvpStatus;
  const canMarkMessageState = !['confirmed', 'declined', 'checked-in'].includes(current);
  if (status.status === 'delivered') {
    updates.deliveredAt = new Date().toISOString();
    if (canMarkMessageState) updates.rsvpStatus = 'delivered';
  }
  if (status.status === 'read') {
    updates.readAt = new Date().toISOString();
    if (canMarkMessageState) updates.rsvpStatus = 'read';
  }
  if (status.status === 'failed') updates.rsvpStatus = 'failed';
  if (Object.keys(updates).length) await updateGuest(guest.id, updates);
  await logTimeline(guest, `message_${status.status}`, { messageId, status }, 'meta');
}

async function processWebhookBody(body) {
  await logWebhookEvent('meta_webhook_raw', body);
  if (body.object !== 'whatsapp_business_account') return { ok: true, ignored: true };

  const summary = { messages: 0, statuses: 0, handled: 0 };
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      for (const message of value.messages || []) {
        summary.messages += 1;
        const listResult = await processListReply(message);
        if (listResult.handled) summary.handled += 1;
        const buttonResult = await processButton(message);
        if (buttonResult.handled) summary.handled += 1;
      }
      for (const status of value.statuses || []) {
        summary.statuses += 1;
        await processStatus(status);
      }
    }
  }
  await logWebhookEvent('meta_webhook_processed', summary);
  return { ok: true, summary };
}

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge') || '';
    if (mode === 'subscribe' && token === metaWebhookVerifyToken) return send(res, 200, challenge);
    return send(res, 403, 'Forbidden');
  }

  if (req.method !== 'POST') return send(res, 405, 'Method not allowed');

  try {
    const body = await readBody(req);
    // Important: process before responding. Some serverless runtimes stop work after res.end(),
    // which was the likely reason RSVP updates and confirmation messages did not complete.
    await processWebhookBody(body);
    return send(res, 200, 'OK');
  } catch (error) {
    console.error('[webhook/meta] Error', error);
    try { await logWebhookEvent('meta_webhook_error', { error: String(error.message || error) }); } catch (_) {}
    // Always return 200 to Meta after receiving the webhook so Meta does not disable delivery.
    return send(res, 200, 'OK');
  }
};
