const { metaApiVersion, metaAccessToken, metaPhoneNumberId, defaultLanguage, templateParameterMode, weddingInvitationTemplate, weddingInvitationImageTemplate, rsvpConfirmedTemplate, rsvpDeclinedTemplate, rsvpReminderTemplate, entryCardTemplate } = require('./config');
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


function imageHeaderComponent(imageUrl) {
  if (!imageUrl) return null;
  return {
    type: 'header',
    parameters: [
      {
        type: 'image',
        image: { link: imageUrl }
      }
    ]
  };
}

async function sendTemplateBySelection(params = {}) {
  const requested = params.templateName || params.template || weddingInvitationTemplate;
  const languageCode = params.languageCode || defaultLanguage;
  const imageUrl = params.imageUrl || params.invitationImageUrl || params.cardUrl || '';

  const aliases = {
    dawaa_wedding_invitation: weddingInvitationTemplate,
    dawaa_wedding_invitation_image: weddingInvitationImageTemplate,
    dawaa_rsvp_confirmed: rsvpConfirmedTemplate,
    dawaa_rsvp_declined: rsvpDeclinedTemplate,
    dawaa_rsvp_reminder: rsvpReminderTemplate,
    dawaa_entry_card: entryCardTemplate
  };

  const templateName = aliases[requested] || requested;

  // Both updated invitation templates use named variables like {{guest_name}}.
  if (templateName === weddingInvitationTemplate || templateName === weddingInvitationImageTemplate) {
    const isImage = templateName === weddingInvitationImageTemplate;
    if (isImage && !imageUrl) {
      return {
        status: 'failed',
        messageId: '',
        error: 'قالب الدعوة المصور يحتاج رابط صورة',
        requestBody: { templateName, imageUrl }
      };
    }

    const components = invitationComponents(params, 'named');
    const header = isImage ? imageHeaderComponent(imageUrl) : null;
    return sendTemplate(params.phoneNumber, templateName, header ? [header, ...components] : components, languageCode);
  }

  if (templateName === entryCardTemplate) {
    if (!imageUrl) {
      return {
        status: 'failed',
        messageId: '',
        error: 'قالب بطاقة الدخول يحتاج رابط صورة',
        requestBody: { templateName, imageUrl }
      };
    }

    return sendTemplate(params.phoneNumber, templateName, [
      imageHeaderComponent(imageUrl),
      {
        type: 'body',
        parameters: [
          { type: 'text', text: params.receptionTime || params.reception_time || '-' },
          { type: 'text', text: params.locationLink || params.location_link || '-' }
        ]
      }
    ].filter(Boolean), languageCode);
  }

  if ([rsvpConfirmedTemplate, rsvpDeclinedTemplate, rsvpReminderTemplate].includes(templateName)) {
    return sendTemplate(params.phoneNumber, templateName, [], languageCode);
  }

  return {
    status: 'failed',
    messageId: '',
    error: `اسم القالب غير معروف داخل المشروع: ${templateName}`,
    requestBody: { requested, templateName }
  };

}

module.exports = { sendTemplate, sendWeddingInvitation, sendTemplateBySelection, sendRsvpConfirmed, sendRsvpDeclined, sendCardCountSelection };