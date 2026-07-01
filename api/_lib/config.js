// DAWAA WhatsApp Meta configuration
// These names must match Meta WhatsApp Manager exactly.

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

const metaApiVersion = env('META_API_VERSION', 'v20.0');
const metaAccessToken = env('META_ACCESS_TOKEN', env('WHATSAPP_ACCESS_TOKEN', ''));
const metaPhoneNumberId = env('META_PHONE_NUMBER_ID', env('WHATSAPP_PHONE_NUMBER_ID', ''));
const defaultLanguage = env('META_TEMPLATE_LANGUAGE', 'ar');

// Exact templates currently active in Meta:
const weddingInvitationTemplate = env('DAWAA_WEDDING_INVITATION_TEMPLATE', 'dawaa_wedding_invitation');
const weddingInvitationImageTemplate = env('DAWAA_WEDDING_INVITATION_IMAGE_TEMPLATE', 'dawaa_wedding_invitation_image');
const rsvpConfirmedTemplate = env('DAWAA_RSVP_CONFIRMED_TEMPLATE', 'dawaa_rsvp_confirmed');
const rsvpDeclinedTemplate = env('DAWAA_RSVP_DECLINED_TEMPLATE', 'dawaa_rsvp_declined');
const rsvpReminderTemplate = env('DAWAA_RSVP_REMINDER_TEMPLATE', 'dawaa_rsvp_reminder');
const entryCardTemplate = env('DAWAA_ENTRY_CARD_TEMPLATE', 'dawaa_entry_card');

// Important:
// Your current no-image invitation in Meta shows named variables like {{guest_name}}.
// Therefore default mode must be named, not numbered.
const templateParameterMode = env('DAWAA_TEMPLATE_PARAMETER_MODE', 'named');

module.exports = {
  metaApiVersion,
  metaAccessToken,
  metaPhoneNumberId,
  defaultLanguage,
  templateParameterMode,
  weddingInvitationTemplate,
  weddingInvitationImageTemplate,
  rsvpConfirmedTemplate,
  rsvpDeclinedTemplate,
  rsvpReminderTemplate,
  entryCardTemplate
};
