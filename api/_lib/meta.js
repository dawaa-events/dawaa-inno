const {
  metaApiVersion,
  metaAccessToken,
  metaPhoneNumberId,
  defaultLanguage,
  templateParameterMode,
  rsvpConfirmedTemplate,
  rsvpDeclinedTemplate
} = require('./config');

async function postMetaMessage(body) {
  if (!metaAccessToken || !metaPhoneNumberId) {
    return { status: 'failed', messageId: '', error: 'Meta API credentials are not configured', requestBody: body };
  }
  const url = `https://graph.facebook.com/${metaApiVersion}/${metaPhoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${metaAccessToken}` },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  if (!response.ok) return { status: 'failed', messageId: '', error: `HTTP ${response.status}: ${text}`, requestBody: body };
  const data = JSON.parse(text || '{}');
  return { status: 'sent', messageId: data.messages?.[0]?.id || '', raw: data };
}

async function sendTemplate(phoneNumber, templateName, components = [], languageCode = defaultLanguage) {
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'template',
    template: { name: templateName, language: { code: languageCode } }
  };
  if (components && components.length) body.template.components = components;
  return postMetaMessage(body);
}

async function sendText(phoneNumber, text) {
  return postMetaMessage({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'text',
    text: { preview_url: false, body: text }
  });
}

const invitationValues = ({ guestName, hostOne, hostTwo, brideName, groomName, cardsCount }) => ([
  ['guest_name', guestName || '-'],
  ['host_one', hostOne || '-'],
  ['host_two', hostTwo || '-'],
  ['bride_name', brideName || '-'],
  ['groom_name', groomName || '-'],
  ['cards_count', String(cardsCount || 1)]
]);

function invitationComponents(params, mode = 'named') {
  return [{
    type: 'body',
    parameters: invitationValues(params).map(([parameter_name, text]) => {
      const item = { type: 'text', text };
      if (mode === 'named') item.parameter_name = parameter_name;
      return item;
    })
  }];
}

function looksLikeParameterModeError(error = '') {
  const e = String(error).toLowerCase();
  return e.includes('parameter_name') || e.includes('localizable_params') || e.includes('number of localizable params') || e.includes('invalid parameter') || e.includes('missing parameter');
}

async function sendWeddingInvitation(params) {
  const templateName = params.templateName || 'dawaa_wedding_invitation';
  const languageCode = params.languageCode || defaultLanguage;
  const mode = String(params.parameterMode || templateParameterMode || 'auto').toLowerCase();

  if (mode === 'named' || mode === 'numbered') {
    return sendTemplate(params.phoneNumber, templateName, invitationComponents(params, mode), languageCode);
  }

  const named = await sendTemplate(params.phoneNumber, templateName, invitationComponents(params, 'named'), languageCode);
  if (named.status === 'sent' || !looksLikeParameterModeError(named.error)) return named;

  const numbered = await sendTemplate(params.phoneNumber, templateName, invitationComponents(params, 'numbered'), languageCode);
  if (numbered.status === 'sent') return { ...numbered, retriedParameterMode: 'numbered', firstAttemptError: named.error };
  return { ...numbered, firstAttemptError: named.error };
}

async function sendRsvpConfirmed(phoneNumber) {
  // First try the approved template. If it fails, fall back to a normal text message
  // because the guest just replied, so the 24-hour service window is open.
  const templated = await sendTemplate(phoneNumber, rsvpConfirmedTemplate || 'dawaa_rsvp_confirmed', [], defaultLanguage);
  if (templated.status === 'sent') return templated;
  const text = await sendText(phoneNumber, 'شكراً لتأكيد حضوركم، تم تسجيل الرد بنجاح. نسعد بحضوركم.');
  return text.status === 'sent' ? { ...text, templateFallbackError: templated.error } : { ...templated, textFallbackError: text.error };
}

async function sendRsvpDeclined(phoneNumber) {
  const templated = await sendTemplate(phoneNumber, rsvpDeclinedTemplate || 'dawaa_rsvp_declined', [], defaultLanguage);
  if (templated.status === 'sent') return templated;
  const text = await sendText(phoneNumber, 'شكراً على ردكم، تم تسجيل الاعتذار بنجاح.');
  return text.status === 'sent' ? { ...text, templateFallbackError: templated.error } : { ...templated, textFallbackError: text.error };
}

async function sendCardCountSelection(phoneNumber, guestName, cardsCount) {
  const rows = Array.from({ length: Number(cardsCount || 1) }, (_, i) => {
    const count = i + 1;
    return { id: `card_count_${count}`, title: `${count} ${count === 1 ? 'شخص' : 'أشخاص'}`, description: `تأكيد حضور ${count} من أصل ${cardsCount}` };
  });
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: 'تأكيد عدد الحضور' },
      body: { text: `الفاضلة / ${guestName || '-'}\nيرجى اختيار عدد الحضور من البطاقات المخصصة لكم.` },
      footer: { text: 'دعوة Events' },
      action: { button: 'اختيار العدد', sections: [{ title: 'عدد الحضور', rows }] }
    }
  };
  return postMetaMessage(body);
}

module.exports = { postMetaMessage, sendTemplate, sendText, sendWeddingInvitation, sendRsvpConfirmed, sendRsvpDeclined, sendCardCountSelection };
