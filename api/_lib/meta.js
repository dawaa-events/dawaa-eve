const {
  metaApiVersion,
  metaAccessToken,
  metaPhoneNumberId,
  defaultLanguage,
  templates
} = require('./config');

const TEMPLATE_DEFINITIONS = {
  [templates.weddingInvitation]: {
    key: 'weddingInvitation',
    category: 'Marketing',
    hasImageHeader: false,
    bodyMode: 'named',
    bodyParams: ['guest_name', 'host_one', 'host_two', 'bride_name', 'groom_name', 'cards_count']
  },
  [templates.weddingInvitationImage]: {
    key: 'weddingInvitationImage',
    category: 'Marketing',
    hasImageHeader: true,
    bodyMode: 'named',
    bodyParams: ['guest_name', 'host_one', 'host_two', 'bride_name', 'groom_name', 'cards_count']
  },
  [templates.rsvpConfirmed]: {
    key: 'rsvpConfirmed',
    category: 'Marketing',
    hasImageHeader: false,
    bodyMode: 'none',
    bodyParams: []
  },
  [templates.rsvpDeclined]: {
    key: 'rsvpDeclined',
    category: 'Marketing',
    hasImageHeader: false,
    bodyMode: 'none',
    bodyParams: []
  },
  [templates.entryCard]: {
    key: 'entryCard',
    category: 'Utility',
    hasImageHeader: true,
    bodyMode: 'numbered',
    bodyParams: ['reception_time', 'location_link']
  },
  [templates.rsvpReminder]: {
    key: 'rsvpReminder',
    category: 'Utility',
    hasImageHeader: false,
    bodyMode: 'none',
    bodyParams: []
  }
};

const TEMPLATE_ALIASES = {
  dawaa_wedding_invitation: templates.weddingInvitation,
  wedding_invitation: templates.weddingInvitation,
  invitation: templates.weddingInvitation,

  dawaa_wedding_invitation_image: templates.weddingInvitationImage,
  wedding_invitation_image: templates.weddingInvitationImage,
  invitation_image: templates.weddingInvitationImage,

  dawaa_rsvp_confirmed: templates.rsvpConfirmed,
  rsvp_confirmed: templates.rsvpConfirmed,
  confirmed: templates.rsvpConfirmed,

  dawaa_rsvp_declined: templates.rsvpDeclined,
  rsvp_declined: templates.rsvpDeclined,
  declined: templates.rsvpDeclined,

  dawaa_entry_card: templates.entryCard,
  entry_card: templates.entryCard,

  dawaa_rsvp_reminder: templates.rsvpReminder,
  rsvp_reminder: templates.rsvpReminder,
  reminder: templates.rsvpReminder
};

function normalizeTemplateName(name) {
  const requested = String(name || templates.weddingInvitation).trim();
  return TEMPLATE_ALIASES[requested] || requested;
}

function asText(value, fallback = '-') {
  const text = value === undefined || value === null || value === '' ? fallback : String(value);
  return text;
}

function templateValue(params, name) {
  const values = {
    guest_name: params.guestName || params.guest_name || params.name,
    host_one: params.hostOne || params.host_one,
    host_two: params.hostTwo || params.host_two,
    bride_name: params.brideName || params.bride_name,
    groom_name: params.groomName || params.groom_name,
    cards_count: params.cardsCount || params.cards_count || params.cards || 1,
    reception_time: params.receptionTime || params.reception_time,
    location_link: params.locationLink || params.location_link
  };
  return asText(values[name], name === 'cards_count' ? '1' : '-');
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

function bodyComponent(definition, params) {
  if (!definition.bodyParams || !definition.bodyParams.length || definition.bodyMode === 'none') {
    return null;
  }

  const parameters = definition.bodyParams.map((name) => {
    const item = {
      type: 'text',
      text: templateValue(params, name)
    };

    // Updated invitation templates use named parameters like {{guest_name}}.
    if (definition.bodyMode === 'named') {
      item.parameter_name = name;
    }

    return item;
  });

  return {
    type: 'body',
    parameters
  };
}

function buildTemplateComponents(templateName, params = {}) {
  const definition = TEMPLATE_DEFINITIONS[templateName];
  if (!definition) {
    return {
      ok: false,
      error: `Unknown WhatsApp template: ${templateName}`,
      components: []
    };
  }

  const imageUrl = params.imageUrl || params.invitationImageUrl || params.cardUrl || params.entryCardUrl || '';
  const components = [];

  if (definition.hasImageHeader) {
    if (!imageUrl) {
      return {
        ok: false,
        error: `Template ${templateName} requires image header but no image URL was provided`,
        components: []
      };
    }
    components.push(imageHeaderComponent(imageUrl));
  }

  const body = bodyComponent(definition, params);
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

  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text || '{}'); } catch (_) { data = { raw: text }; }

  if (!response.ok) {
    return {
      status: 'failed',
      messageId: '',
      error: data?.error?.message || `HTTP ${response.status}: ${text}`,
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

  if (components && components.length) {
    body.template.components = components;
  }

  return postMetaMessage(body);
}

async function sendTemplateBySelection(params = {}) {
  const templateName = normalizeTemplateName(params.templateName || params.template);
  const definition = TEMPLATE_DEFINITIONS[templateName];

  if (!definition) {
    return {
      status: 'failed',
      messageId: '',
      error: `Template not registered in project: ${templateName}`,
      requestBody: { requested: params.templateName || params.template, templateName }
    };
  }

  const built = buildTemplateComponents(templateName, params);
  if (!built.ok) {
    return {
      status: 'failed',
      messageId: '',
      error: built.error,
      requestBody: { templateName, paramsPreview: {
        phoneNumber: params.phoneNumber,
        imageUrl: params.imageUrl || params.invitationImageUrl || params.cardUrl || params.entryCardUrl || '',
        guestName: params.guestName,
        cardsCount: params.cardsCount
      }}
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
