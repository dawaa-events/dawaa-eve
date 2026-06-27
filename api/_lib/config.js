const required = (name) => process.env[name] || '';

module.exports = {
  metaApiVersion: process.env.META_API_VERSION || 'v25.0',
  metaAccessToken: required('META_ACCESS_TOKEN'),
  metaPhoneNumberId: required('META_PHONE_NUMBER_ID'),
  metaWebhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN || 'dawaa_webhook_2024',
  supabaseUrl: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  defaultTemplateName: process.env.META_INVITATION_TEMPLATE || 'dawaa_wedding_invitation',
  rsvpConfirmedTemplate: process.env.META_RSVP_CONFIRMED_TEMPLATE || 'dawaa_rsvp_confirmed',
  rsvpDeclinedTemplate: process.env.META_RSVP_DECLINED_TEMPLATE || 'dawaa_rsvp_declined',
  defaultLanguage: process.env.META_TEMPLATE_LANGUAGE || 'ar',
  templateParameterMode: process.env.META_TEMPLATE_PARAMETER_MODE || 'auto',
  sendApiToken: process.env.DAWAA_SEND_API_TOKEN || process.env.INTERNAL_API_TOKEN || ''
};
