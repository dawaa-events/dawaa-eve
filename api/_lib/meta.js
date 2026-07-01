const {
  metaApiVersion,
  metaAccessToken,
  metaPhoneNumberId,
  defaultLanguage,
  templates
} = require('./config');

/**
 * CURRENT META TEMPLATES ONLY — based on your screenshots.
 *
 * 1) dawaa_wedding_invitation
 *    Marketing, no media header, named body variables, quick reply buttons already inside Meta.
 *
 * 2) dawaa_wedding_invitation_image
 *    Marketing, image header, named body variables, quick reply buttons already inside Meta.
 *
 * 3) dawaa_rsvp_confirmed
 *    Marketing, no variables, no media.
 *
 * 4) dawaa_rsvp_declined
 *    Marketing, no variables, no media.
 *
 * 5) dawaa_rsvp_reminder
 *    Utility, no variables, quick reply buttons already inside Meta.
 *
 * 6) dawaa_entry_card
 *    Utility, no variables, no media header, URL button already inside Meta.
 */
const TEMPLATE_DEFINITIONS = {
  [templates.weddingInvitation]: {
    key: 'weddingInvitation',
    hasImageHeader: false,
    bodyMode: 'named',
    bodyParams: ['guest_name', 'host_one', 'host_two', 'bride_name', 'groom_name', 'cards_count']
  },
  [templates.weddingInvitationImage]: {
    key: 'weddingInvitationImage',
    hasImageHeader: true,
    bodyMode: 'named',
    bodyParams: ['guest_name', 'host_one', 'host_two', 'bride_name', 'groom_name', 'cards_count']
  },
  [templates.rsvpConfirmed]: {
    key: 'rsvpConfirmed',
    hasImageHeader: false,
    bodyMode: 'none',
    bodyParams: []
  },
  [templates.rsvpDeclined]: {
    key: 'rsvpDeclined',
    hasImageHeader: false,
    bodyMode: 'none',
    bodyParams: []
  },
  [templates.rsvpReminder]: {
    key: 'rsvpReminder',
    hasImageHeader: false,
    bodyMode: 'none',
    bodyParams: []
  },
  [templates.entryCard]: {
    key: 'entryCard',
    hasImageHeader: false,
    bodyMode: 'none',
    bodyParams: []
  }
};

function normalizeTemplateName(name) {
  const templateName = String(name || '').trim();
  if (!templateName) return templates.weddingInvitation;
  return templateName;
}

function valueToText(value, fallback = '-') {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value);
}

function variableValue(params, name) {
  const values = {
    guest_name: params.guestName || params.guest_name || params.name,
    host_one: params.hostOne || params.host_one,
    host_two: params.hostTwo || params.host_two,
    bride_name: params.brideName || params.bride_name,
    groom_name: params.groomName || params.groom_name,
    cards_count: params.cardsCount || params.cards_count || params.cards || 1
  };
  return valueToText(values[name], name === 'cards_count' ? '1' : '-');
}

function imageHeaderComponent(imageUrl) {
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

function buildBodyComponent(definition, params) {
  if (!definition.bodyParams.length || definition.bodyMode === 'none') return null;

  return {
    type: 'body',
    parameters: definition.bodyParams.map((name) => {
      const parameter = {
        type: 'text',
        text: variableValue(params, name)
      };

      // Meta "Type of variable: Name" requires parameter_name.
      if (definition.bodyMode === 'named') {
        parameter.parameter_name = name;
      }

      return parameter;
    })
  };
}

function buildTemplateComponents(templateName, params = {}) {
  const definition = TEMPLATE_DEFINITIONS[templateName];

  if (!definition) {
    return {
      ok: false,
      error: `القالب غير موجود في تعريفات المشروع الحالية: ${templateName}`,
      components: []
    };
  }

  const components = [];
  const imageUrl = params.imageUrl || params.invitationImageUrl || '';

  if (definition.hasImageHeader) {
    if (!imageUrl) {
      return {
        ok: false,
        error: `القالب ${templateName} يحتاج صورة Header، لكن رابط الصورة غير موجود`,
        components: []
      };
    }
    components.push(imageHeaderComponent(imageUrl));
  }

  const body = buildBodyComponent(definition, params);
  if (body) components.push(body);

  return { ok: true, components, definition };
}

async function postMetaMessage(body) {
  if (!metaAccessToken || !metaPhoneNumberId) {
    return {
      status: 'failed',
      messageId: '',
      error: 'Meta API credentials are not configured',
      requestBody: body
    };
  }

  const url = `https://graph.facebook.com/${metaApiVersion}/${metaPhoneNumberId}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${metaAccessToken}`
    },
    body: JSON.stringify(body)
  });

  const responseText = await response.text();
  let data = {};
  try {
    data = JSON.parse(responseText || '{}');
  } catch (_) {
    data = { raw: responseText };
  }

  if (!response.ok) {
    return {
      status: 'failed',
      messageId: '',
      error: data?.error?.message || `HTTP ${response.status}: ${responseText}`,
      errorCode: data?.error?.code || '',
      errorSubcode: data?.error?.error_subcode || '',
      requestBody: body,
      raw: data
    };
  }

  const messageId = data.messages?.[0]?.id || '';
  if (!messageId) {
    return {
      status: 'failed',
      messageId: '',
      error: 'Meta accepted the request but did not return a message id',
      requestBody: body,
      raw: data
    };
  }

  return {
    status: 'sent',
    messageId,
    raw: data,
    requestBody: body
  };
}

async function sendTemplate(phoneNumber, templateName, components = [], languageCode = defaultLanguage) {
  const body = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phoneNumber,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode }
    }
  };

  if (components.length) {
    body.template.components = components;
  }

  return postMetaMessage(body);
}

async function sendTemplateBySelection(params = {}) {
  const templateName = normalizeTemplateName(params.templateName || params.template);
  const built = buildTemplateComponents(templateName, params);

  if (!built.ok) {
    return {
      status: 'failed',
      messageId: '',
      error: built.error,
      requestBody: {
        requested: params.templateName || params.template,
        templateName
      }
    };
  }

  return sendTemplate(params.phoneNumber, templateName, built.components, params.languageCode || defaultLanguage);
}

async function sendWeddingInvitation(params = {}) {
  return sendTemplateBySelection({
    ...params,
    templateName: params.templateName || templates.weddingInvitation
  });
}

async function sendRsvpConfirmed(phoneNumber) {
  return sendTemplateBySelection({ phoneNumber, templateName: templates.rsvpConfirmed });
}

async function sendRsvpDeclined(phoneNumber) {
  return sendTemplateBySelection({ phoneNumber, templateName: templates.rsvpDeclined });
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

module.exports = {
  TEMPLATE_DEFINITIONS,
  sendTemplate,
  sendWeddingInvitation,
  sendTemplateBySelection,
  sendRsvpConfirmed,
  sendRsvpDeclined,
  sendCardCountSelection
};
