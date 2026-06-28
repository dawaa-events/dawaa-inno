const { metaApiVersion, metaAccessToken, metaPhoneNumberId, defaultLanguage, templateParameterMode, rsvpConfirmedTemplate, rsvpDeclinedTemplate } = require('./config');

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

  // Auto mode: try named variables first because the supplied developer package uses names.
  // If Meta rejects the parameter format, retry numbered {{1}}..{{6}} templates automatically.
  const named = await sendTemplate(params.phoneNumber, templateName, invitationComponents(params, 'named'), languageCode);
  if (named.status === 'sent' || !looksLikeParameterModeError(named.error)) return named;

  const numbered = await sendTemplate(params.phoneNumber, templateName, invitationComponents(params, 'numbered'), languageCode);
  if (numbered.status === 'sent') return { ...numbered, retriedParameterMode: 'numbered', firstAttemptError: named.error };
  return { ...numbered, firstAttemptError: named.error };
}

async function sendRsvpConfirmed(phoneNumber) {
  return sendTemplate(phoneNumber, rsvpConfirmedTemplate, [], defaultLanguage);
}

async function sendRsvpDeclined(phoneNumber) {
  return sendTemplate(phoneNumber, rsvpDeclinedTemplate, [], defaultLanguage);
}

async function sendCardCountSelection(phoneNumber, guestName, cardsCount) {
  const totalCards = Math.max(1, Number(cardsCount || 1));

  const visibleCounts = totalCards <= 10
    ? Array.from({ length: totalCards }, (_, i) => i + 1)
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, totalCards];

  const rows = visibleCounts.map((count) => ({
    id: `card_count_${count}`,
    title: count === totalCards ? `${count} بطاقات (الكل)` : `${count} ${count === 1 ? 'بطاقة' : 'بطاقات'}`,
    description: count === totalCards
      ? `تأكيد حضور جميع البطاقات (${totalCards})`
      : `تأكيد حضور ${count} من أصل ${totalCards}`
  }));

  return postMetaMessage({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: 'تأكيد عدد البطاقات' },
      body: {
        text: `الفاضلة / ${guestName || '-'}\nلديكم ${totalCards} ${totalCards === 1 ? 'بطاقة' : 'بطاقات'} مخصصة.\nيرجى اختيار عدد البطاقات التي تريدون تأكيد حضورها.`
      },
      footer: { text: 'دعوة Events' },
      action: {
        button: 'اختيار العدد',
        sections: [{ title: 'عدد البطاقات', rows }]
      }
    }
  });
}

module.exports = { sendTemplate, sendWeddingInvitation, sendRsvpConfirmed, sendRsvpDeclined, sendCardCountSelection };
