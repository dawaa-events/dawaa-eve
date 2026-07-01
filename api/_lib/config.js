// DAWAA WhatsApp / Meta configuration
// This file is intentionally explicit because Meta templates were rebuilt/updated.

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

const metaApiVersion = env('META_API_VERSION', 'v20.0');
const metaAccessToken = env('META_ACCESS_TOKEN', env('WHATSAPP_ACCESS_TOKEN', ''));
const metaPhoneNumberId = env('META_PHONE_NUMBER_ID', env('WHATSAPP_PHONE_NUMBER_ID', ''));
const defaultLanguage = env('META_TEMPLATE_LANGUAGE', 'ar');

// Current approved template names in Meta WhatsApp Manager:
const templates = {
  weddingInvitation: env('DAWAA_WEDDING_INVITATION_TEMPLATE', 'dawaa_wedding_invitation'),
  weddingInvitationImage: env('DAWAA_WEDDING_INVITATION_IMAGE_TEMPLATE', 'dawaa_wedding_invitation_image'),
  rsvpConfirmed: env('DAWAA_RSVP_CONFIRMED_TEMPLATE', 'dawaa_rsvp_confirmed'),
  rsvpDeclined: env('DAWAA_RSVP_DECLINED_TEMPLATE', 'dawaa_rsvp_declined'),
  entryCard: env('DAWAA_ENTRY_CARD_TEMPLATE', 'dawaa_entry_card'),
  rsvpReminder: env('DAWAA_RSVP_REMINDER_TEMPLATE', 'dawaa_rsvp_reminder')
};

module.exports = {
  metaApiVersion,
  metaAccessToken,
  metaPhoneNumberId,
  defaultLanguage,
  templates,

  // Backward-compatible exports used by older webhook code:
  weddingInvitationTemplate: templates.weddingInvitation,
  weddingInvitationImageTemplate: templates.weddingInvitationImage,
  rsvpConfirmedTemplate: templates.rsvpConfirmed,
  rsvpDeclinedTemplate: templates.rsvpDeclined,
  rsvpReminderTemplate: templates.rsvpReminder,
  entryCardTemplate: templates.entryCard,
  templateParameterMode: 'named'
};
