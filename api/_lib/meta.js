const { metaApiVersion, metaAccessToken, metaPhoneNumberId, defaultLanguage, templates, currentTemplates, useUtilityTemplateRouter } = require('./config');

const TEMPLATE_SHAPES = {
  weddingInvitation: { hasImageHeader:false, bodyMode:'named', bodyParams:['guest_name','host_one','host_two','bride_name','groom_name','cards_count'] },
  weddingInvitationImage: { hasImageHeader:true, bodyMode:'named', bodyParams:['guest_name','host_one','host_two','bride_name','groom_name','cards_count'] },
  rsvpConfirmed: { hasImageHeader:false, bodyMode:'none', bodyParams:[] },
  rsvpDeclined: { hasImageHeader:false, bodyMode:'none', bodyParams:[] },
  rsvpReminder: { hasImageHeader:false, bodyMode:'none', bodyParams:[] },
  entryCard: { hasImageHeader:false, bodyMode:'none', bodyParams:[] }
};

const TEMPLATE_BY_NAME = {};
Object.entries(templates).forEach(([key,name]) => { if(name) TEMPLATE_BY_NAME[name] = { key, ...TEMPLATE_SHAPES[key] }; });
Object.entries(currentTemplates).forEach(([key,name]) => { if(name && !TEMPLATE_BY_NAME[name]) TEMPLATE_BY_NAME[name] = { key, ...TEMPLATE_SHAPES[key] }; });

const TEMPLATE_ALIASES = {
  dawaa_wedding_invitation: templates.weddingInvitation,
  dawaa_wedding_invitation_image: templates.weddingInvitationImage,
  dawaa_rsvp_confirmed: templates.rsvpConfirmed,
  dawaa_rsvp_declined: templates.rsvpDeclined,
  dawaa_rsvp_reminder: templates.rsvpReminder,
  dawaa_entry_card: templates.entryCard,
  invitation: templates.weddingInvitation,
  invitation_image: templates.weddingInvitationImage,
  confirmed: templates.rsvpConfirmed,
  declined: templates.rsvpDeclined,
  reminder: templates.rsvpReminder,
  entry_card: templates.entryCard
};

function normalizeTemplateName(name){ const raw=String(name||templates.weddingInvitation).trim(); return TEMPLATE_ALIASES[raw] || raw; }
function text(v,f='-'){ return (v===undefined || v===null || v==='') ? f : String(v); }
function valueFor(params,key){
  const map = {
    guest_name: params.guestName || params.guest_name || params.name,
    host_one: params.hostOne || params.host_one,
    host_two: params.hostTwo || params.host_two,
    bride_name: params.brideName || params.bride_name,
    groom_name: params.groomName || params.groom_name,
    cards_count: params.cardsCount || params.cards_count || params.cards || 1
  };
  return text(map[key], key==='cards_count' ? '1' : '-');
}
function imageHeaderComponent(url){ return url ? { type:'header', parameters:[{ type:'image', image:{ link:url } }] } : null; }
function bodyComponent(def, params){
  if(!def.bodyParams || !def.bodyParams.length || def.bodyMode==='none') return null;
  return { type:'body', parameters:def.bodyParams.map(name => {
    const item = { type:'text', text:valueFor(params,name) };
    if(def.bodyMode==='named') item.parameter_name = name;
    return item;
  }) };
}
function buildComponents(templateName, params={}){
  const def = TEMPLATE_BY_NAME[templateName];
  if(!def) return { ok:false, error:`القالب غير معرف داخل راوتر دعوة: ${templateName}`, components:[] };
  const imageUrl = params.imageUrl || params.invitationImageUrl || params.cardUrl || params.entryCardUrl || '';
  const components = [];
  if(def.hasImageHeader){
    if(!imageUrl) return { ok:false, error:`القالب ${templateName} يحتاج Header Image ولكن رابط الصورة غير موجود`, components:[] };
    components.push(imageHeaderComponent(imageUrl));
  }
  const body = bodyComponent(def, params);
  if(body) components.push(body);
  return { ok:true, components, definition:def };
}

async function postMetaMessage(body){
  if(!metaAccessToken || !metaPhoneNumberId) return { status:'failed', messageId:'', error:'Meta API credentials are not configured', requestBody:body };
  const url = `https://graph.facebook.com/${metaApiVersion}/${metaPhoneNumberId}/messages`;
  const response = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${metaAccessToken}` }, body:JSON.stringify(body) });
  const responseText = await response.text();
  let data = {}; try { data = JSON.parse(responseText || '{}'); } catch(_) { data = { raw:responseText }; }
  if(!response.ok) return { status:'failed', messageId:'', error:data?.error?.message || `HTTP ${response.status}: ${responseText}`, errorCode:data?.error?.code || '', errorSubcode:data?.error?.error_subcode || '', requestBody:body, raw:data };
  const messageId = data.messages?.[0]?.id || '';
  if(!messageId) return { status:'failed', messageId:'', error:'Meta accepted request but did not return message id', requestBody:body, raw:data };
  return { status:'sent', messageId, raw:data, requestBody:body };
}

async function sendTemplate(phoneNumber, templateName, components=[], languageCode=defaultLanguage){
  const body = { messaging_product:'whatsapp', recipient_type:'individual', to:phoneNumber, type:'template', template:{ name:templateName, language:{ code:languageCode } } };
  if(components && components.length) body.template.components = components;
  return postMetaMessage(body);
}
async function sendTemplateBySelection(params={}){
  const templateName = normalizeTemplateName(params.templateName || params.template);
  const built = buildComponents(templateName, params);
  if(!built.ok) return { status:'failed', messageId:'', error:built.error, requestBody:{ requested:params.templateName || params.template, templateName } };
  return sendTemplate(params.phoneNumber, templateName, built.components, params.languageCode || defaultLanguage);
}
async function sendWeddingInvitation(params={}){ return sendTemplateBySelection({ ...params, templateName: params.templateName || templates.weddingInvitation }); }
async function sendRsvpConfirmed(phoneNumber){ return sendTemplateBySelection({ phoneNumber, templateName: templates.rsvpConfirmed }); }
async function sendRsvpDeclined(phoneNumber){ return sendTemplateBySelection({ phoneNumber, templateName: templates.rsvpDeclined }); }
async function sendCardCountSelection(phoneNumber, guestName, cardsCount){
  const totalCards = Math.max(1, Number(cardsCount || 1));
  const visibleCounts = totalCards <= 10 ? Array.from({ length:totalCards }, (_,i)=>i+1) : [1,2,3,4,5,6,7,8,9,totalCards];
  const rows = visibleCounts.map(count => ({ id:`card_count_${count}`, title: count===totalCards ? `${count} بطاقات (الكل)` : `${count} ${count===1?'بطاقة':'بطاقات'}`, description: count===totalCards ? `تأكيد حضور جميع البطاقات (${totalCards})` : `تأكيد حضور ${count} من أصل ${totalCards}` }));
  return postMetaMessage({ messaging_product:'whatsapp', recipient_type:'individual', to:phoneNumber, type:'interactive', interactive:{ type:'list', header:{ type:'text', text:'تأكيد عدد البطاقات' }, body:{ text:`الفاضلة / ${guestName || '-'}\nلديكم ${totalCards} ${totalCards===1?'بطاقة':'بطاقات'} مخصصة.\nيرجى اختيار عدد البطاقات التي تريدون تأكيد حضورها.` }, footer:{ text:'دعوة Events' }, action:{ button:'اختيار العدد', sections:[{ title:'عدد البطاقات', rows }] } } });
}

module.exports = { TEMPLATE_SHAPES, TEMPLATE_BY_NAME, useUtilityTemplateRouter, sendTemplate, sendWeddingInvitation, sendTemplateBySelection, sendRsvpConfirmed, sendRsvpDeclined, sendCardCountSelection };
