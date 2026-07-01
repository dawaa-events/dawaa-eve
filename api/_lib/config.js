function env(name, fallback = '') {
  return process.env[name] || fallback;
}

const metaApiVersion = env('META_API_VERSION', 'v20.0');
const metaAccessToken = env('META_ACCESS_TOKEN', env('WHATSAPP_ACCESS_TOKEN', ''));
const metaPhoneNumberId = env('META_PHONE_NUMBER_ID', env('WHATSAPP_PHONE_NUMBER_ID', ''));
const defaultLanguage = env('META_TEMPLATE_LANGUAGE', 'ar');

// EXACT CURRENT META TEMPLATES ONLY.
// Do not add old names here.
const templates = {
  weddingInvitation: 'dawaa_wedding_invitation',
  weddingInvitationImage: 'dawaa_wedding_invitation_image',
  rsvpConfirmed: 'dawaa_rsvp_confirmed',
  rsvpDeclined: 'dawaa_rsvp_declined',
  rsvpReminder: 'dawaa_rsvp_reminder',
  entryCard: 'dawaa_entry_card'
};

module.exports = {
  metaApiVersion,
  metaAccessToken,
  metaPhoneNumberId,
  defaultLanguage,
  templates,

  // Backward-compatible exports for old webhook imports only.
  rsvpConfirmedTemplate: templates.rsvpConfirmed,
  rsvpDeclinedTemplate: templates.rsvpDeclined,
  rsvpReminderTemplate: templates.rsvpReminder,
  entryCardTemplate: templates.entryCard,
  templateParameterMode: 'named'
};
