function env(name, fallback = '') { return process.env[name] || fallback; }

const metaApiVersion = env('META_API_VERSION', 'v20.0');
const metaAccessToken = env('META_ACCESS_TOKEN', env('WHATSAPP_ACCESS_TOKEN', ''));
const metaPhoneNumberId = env('META_PHONE_NUMBER_ID', env('WHATSAPP_PHONE_NUMBER_ID', ''));
const defaultLanguage = env('META_TEMPLATE_LANGUAGE', 'ar');

const currentTemplates = {
  weddingInvitation: env('DAWAA_WEDDING_INVITATION_TEMPLATE', 'dawaa_wedding_invitation'),
  weddingInvitationImage: env('DAWAA_WEDDING_INVITATION_IMAGE_TEMPLATE', 'dawaa_wedding_invitation_image'),
  rsvpConfirmed: env('DAWAA_RSVP_CONFIRMED_TEMPLATE', 'dawaa_rsvp_confirmed'),
  rsvpDeclined: env('DAWAA_RSVP_DECLINED_TEMPLATE', 'dawaa_rsvp_declined'),
  rsvpReminder: env('DAWAA_RSVP_REMINDER_TEMPLATE', 'dawaa_rsvp_reminder'),
  entryCard: env('DAWAA_ENTRY_CARD_TEMPLATE', 'dawaa_entry_card')
};

const utilityTemplates = {
  weddingInvitation: env('DAWAA_UTILITY_WEDDING_INVITATION_TEMPLATE', ''),
  weddingInvitationImage: env('DAWAA_UTILITY_WEDDING_INVITATION_IMAGE_TEMPLATE', ''),
  rsvpConfirmed: env('DAWAA_UTILITY_RSVP_CONFIRMED_TEMPLATE', ''),
  rsvpDeclined: env('DAWAA_UTILITY_RSVP_DECLINED_TEMPLATE', ''),
  rsvpReminder: env('DAWAA_UTILITY_RSVP_REMINDER_TEMPLATE', 'dawaa_rsvp_reminder'),
  entryCard: env('DAWAA_UTILITY_ENTRY_CARD_TEMPLATE', 'dawaa_entry_card')
};

const useUtilityTemplateRouter = String(env('DAWAA_USE_UTILITY_TEMPLATE_ROUTER', 'false')).toLowerCase() === 'true';
function pickTemplate(key) { return useUtilityTemplateRouter && utilityTemplates[key] ? utilityTemplates[key] : currentTemplates[key]; }

const templates = {
  weddingInvitation: pickTemplate('weddingInvitation'),
  weddingInvitationImage: pickTemplate('weddingInvitationImage'),
  rsvpConfirmed: pickTemplate('rsvpConfirmed'),
  rsvpDeclined: pickTemplate('rsvpDeclined'),
  rsvpReminder: pickTemplate('rsvpReminder'),
  entryCard: pickTemplate('entryCard')
};

module.exports = {
  metaApiVersion, metaAccessToken, metaPhoneNumberId, defaultLanguage,
  templates, currentTemplates, utilityTemplates, useUtilityTemplateRouter,
  rsvpConfirmedTemplate: templates.rsvpConfirmed,
  rsvpDeclinedTemplate: templates.rsvpDeclined,
  rsvpReminderTemplate: templates.rsvpReminder,
  entryCardTemplate: templates.entryCard,
  templateParameterMode: 'named'
};
