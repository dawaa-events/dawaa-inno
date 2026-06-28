const { metaWebhookVerifyToken } = require('../_lib/config');
const { normalizePhone } = require('../_lib/phone');
const { sendRsvpConfirmed, sendRsvpDeclined, sendCardCountSelection } = require('../_lib/meta');
const { getGuestByPhone, getGuestByMetaMessageId, updateGuest, insertMessage, logTimeline, logWebhookEvent } = require('../_lib/supabase');

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
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
function classifyButtonText(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return '';
  if (text.includes('decline') || text.includes('reject') || text.includes('no') || text.includes('اعتذر') || text.includes('أعتذر') || text.includes('معتذر') || text.includes('عذر')) return 'btn_decline';
  if (text.includes('confirm') || text.includes('attend') || text.includes('yes') || text.includes('ارغب') || text.includes('أرغب') || text.includes('حضور') || text.includes('حاضر')) return 'btn_confirm';
  return text;
}

function mapButtonId(message) {
  if (message.type === 'interactive' && message.interactive?.type === 'button_reply') {
    return classifyButtonText(message.interactive.button_reply.id || message.interactive.button_reply.title);
  }
  if (message.type === 'interactive' && message.interactive?.type === 'list_reply') {
    return classifyButtonText(message.interactive.list_reply.id || message.interactive.list_reply.title);
  }
  if (message.type === 'button') {
    return classifyButtonText(message.button?.payload || message.button?.text);
  }
  // Some Meta payloads send the reply object without message.type matching old examples.
  if (message.button) return classifyButtonText(message.button.payload || message.button.text);
  if (message.interactive?.button_reply) return classifyButtonText(message.interactive.button_reply.id || message.interactive.button_reply.title);
  return '';
}

async function findGuestForMessage(phoneNumber, contextMessageId) {
  let guest = null;
  if (contextMessageId) guest = await getGuestByMetaMessageId(contextMessageId);
  if (!guest) guest = await getGuestByPhone(phoneNumber);
  return guest;
}

async function processButton(message) {
  if (message.type === 'interactive' && message.interactive?.type === 'list_reply') return;
  const phoneNumber = normalizePhone(message.from);
  const buttonId = mapButtonId(message);
  const contextMessageId = message.context?.id;
  if (!buttonId || buttonId === 'btn_unknown') return;

  const guest = await findGuestForMessage(phoneNumber, contextMessageId);
  await logWebhookEvent('rsvp_button_press', { phoneNumber, buttonId, contextMessageId, found: !!guest });
  if (!guest) return;

  const cardsCount = Math.max(1, Number(guest.cardsCount || guest.pendingCount || 1));
  if (buttonId === 'btn_decline') {
    await updateGuest(guest.id, {
      rsvpStatus: 'declined', confirmedCount: 0, declinedCount: cardsCount, pendingCount: 0, repliedAt: new Date().toISOString()
    });
    await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'button', messageBody: 'أعتذر عن الحضور', status: 'received' });
    await logTimeline(guest, 'rsvp_declined', { cardsCount }, 'meta');
    const declinedSend = await sendRsvpDeclined(phoneNumber);
    await logWebhookEvent('rsvp_declined_confirmation_sent', { phoneNumber, guestId: guest.id, result: declinedSend });
    return;
  }

  if (buttonId === 'btn_confirm' && cardsCount > 1) {
    await updateGuest(guest.id, { rsvpStatus: 'pending', pendingCount: cardsCount, repliedAt: new Date().toISOString() });
    await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'button', messageBody: 'أرغب في الحضور - بانتظار عدد البطاقات', status: 'received' });
    await logTimeline(guest, 'rsvp_confirm_requested_count', { cardsCount }, 'meta');
    const listSend = await sendCardCountSelection(phoneNumber, guest.guestName, cardsCount);
    await logWebhookEvent('rsvp_card_count_list_sent', { phoneNumber, guestId: guest.id, result: listSend });
    return;
  }

  await updateGuest(guest.id, {
    rsvpStatus: 'confirmed', confirmedCount: 1, declinedCount: 0, pendingCount: 0, repliedAt: new Date().toISOString()
  });
  await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'button', messageBody: 'أرغب في الحضور', status: 'received' });
  await logTimeline(guest, 'rsvp_confirmed', { confirmedCount: 1 }, 'meta');
  const confirmSend = await sendRsvpConfirmed(phoneNumber);
  await logWebhookEvent('rsvp_confirmed_template_sent', { phoneNumber, guestId: guest.id, result: confirmSend });
}


async function processListReply(message) {
  if (!(message.type === 'interactive' && message.interactive?.type === 'list_reply')) return;
  const phoneNumber = normalizePhone(message.from);
  const selectedId = message.interactive.list_reply.id || '';
  const match = selectedId.match(/card_count_(\d+)/);
  if (!match) return;
  const selectedCount = Number(match[1]);
  const guest = await findGuestForMessage(phoneNumber, message.context?.id);
  await logWebhookEvent('card_count_selected', { phoneNumber, selectedId, selectedCount, found: !!guest });
  if (!guest) return;
  const cardsCount = Math.max(1, Number(guest.cardsCount || guest.pendingCount || 1));
  const confirmedCount = Math.max(0, Math.min(selectedCount, cardsCount));
  const declinedCount = Math.max(0, cardsCount - confirmedCount);
  await updateGuest(guest.id, {
    rsvpStatus: 'confirmed', confirmedCount, declinedCount, pendingCount: 0, repliedAt: new Date().toISOString()
  });
  await insertMessage({ bookingId: guest.bookingId, guestId: guest.id, phoneNumber, direction: 'inbound', messageType: 'list_reply', messageBody: `تأكيد ${confirmedCount} من ${cardsCount}`, status: 'received' });
  await logTimeline(guest, 'rsvp_confirmed_count', { confirmedCount, declinedCount, cardsCount }, 'meta');
  const confirmSend = await sendRsvpConfirmed(phoneNumber);
  await logWebhookEvent('rsvp_confirmed_count_template_sent', { phoneNumber, guestId: guest.id, result: confirmSend });
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

  const body = await readBody(req);

  try {
    await logWebhookEvent('meta_webhook_raw', body);
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          for (const message of value.messages || []) {
            await processListReply(message);
            await processButton(message);
          }
          for (const status of value.statuses || []) await processStatus(status);
        }
      }
    }
    return send(res, 200, 'OK');
  } catch (error) {
    console.error('[webhook/meta] Error', error);
    try {
      await logWebhookEvent('meta_webhook_error', { error: String(error.message || error), body });
    } catch (_) {}
    // Still return 200 so Meta does not keep retrying forever, but the error is logged in webhook_logs.
    return send(res, 200, 'OK');
  }
};
