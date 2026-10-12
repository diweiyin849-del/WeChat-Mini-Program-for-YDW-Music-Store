const {filterProducts}=require('../miniprogram/domain/catalog');
const {buildQuote}=require('../miniprogram/domain/quote');
const {validateProduct,validateShop,validId}=require('./validation');
const {requireAdmin,error}=require('./permissions');
const {createAppointmentHandlers,appointmentActions}=require('./appointments');
const {normalizeShop,productBrandView}=require('../miniprogram/domain/shop-config');
function publicProduct(p){return {id:p.id,categoryId:p.categoryId,title:p.title,brand:p.brand||'',model:p.model||'',specs:{dimensions:'',material:'',audience:'',accessories:'',...(p.specs||{})},beginnerFriendly:!!p.beginnerFriendly,description:p.description||'',images:p.images||[],shippingType:p.shippingType,deliveryDescription:p.deliveryDescription||'',status:p.status,featured:!!p.featured,skus:(p.skus||[]).map(s=>({id:s.id,productId:p.id,label:s.label,priceFen:s.priceFen,stock:s.stock}))};}
function publicShop(s){if(!s)throw error('NOT_CONFIGURED','店铺资料尚未配置');s=normalizeShop(s);return {name:s.name,provinceCode:s.provinceCode,cityCode:s.cityCode,address:s.address||'',phone:s.phone||'',hours:s.hours||'',shipping:s.shipping,lowStockThreshold:s.lowStockThreshold};}
function checkImage(data){
 if(!data||!['image/png','image/jpeg'].includes(data.mime)||typeof data.base64!=='string'||data.base64.length>700000||! /^[A-Za-z0-9+/]*={0,2}$/.test(data.base64))throw error('INVALID_IMAGE','仅支持512KB以内的PNG或JPEG图片');
 const buf=Buffer.from(data.base64,'base64');
 if(buf.length<12||buf.length>524288)throw error('INVALID_IMAGE','图片大小或内容不正确');
 const isPng=buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const isJpeg=buf[0]===255&&buf[1]===216&&buf[2]===255&&buf[buf.length-2]===255&&buf[buf.length-1]===217;
 if((data.mime==='image/png'&&!isPng)||(data.mime==='image/jpeg'&&!isJpeg))throw error('INVALID_IMAGE','图片内容与格式不一致');
 return buf;
}
function createHandlers({repository,identity,reminders}) {
 return {async handle(action,payload){
  const p=payload||{};
  if(action==='getAppointmentReminderConfig')return reminders?reminders.config():{enabled:false,templateId:'',reason:'微信提醒未启用'};
  if(action==='subscribeAppointmentReminder'){if(!reminders)throw error('NOT_CONFIGURED','微信提醒未启用');return reminders.subscribe(p,identity);}
  if(action==='adminCheckAppointmentSetup'){
   await requireAdmin(repository,identity);let cloudConnected=false;try{cloudConnected=!!reminders&&await reminders.checkConnection();}catch(e){}
   const c=reminders?reminders.config():{enabled:false,reason:'微信提醒未启用'};
   return {cloudConnected,adminAllowed:true,reminderEnabled:c.enabled,reason:cloudConnected?c.reason:'请检查预约及提醒集合是否创建、云函数是否正确部署'};
  }
  if(appointmentActions.includes(action))return createAppointmentHandlers({repository,identity,reminders}).handle(action,p);
  if(action==='listCategories')return (await repository.listCategories()).map(c=>({id:c.id,name:c.name,sort:c.sort})).sort((a,b)=>a.sort-b.sort);
  if(action==='listProducts')return filterProducts((await repository.listProducts()).map(productBrandView),p).map(publicProduct);
  if(action==='getProduct'){const item=await repository.getProduct(p.id);return item&&item.status==='active'?publicProduct(productBrandView(item)):null;}
  if(action==='getShop')return publicShop(await repository.getShop());
  if(action==='getAdminAccess')return {allowed:!!identity.openid&&await repository.isAdmin(identity.openid)};
  if(action==='quote')return buildQuote({input:{lines:p.lines,fulfillment:p.fulfillment,region:p.region},products:await repository.listProducts(),shop:await repository.getShop()});
  const allowed=['adminListProducts','adminSaveProduct','adminSaveCategory','adminSaveShop','adminUploadImage'];
  if(!allowed.includes(action))throw error('UNKNOWN_ACTION','此版本不支持该操作');
  await requireAdmin(repository,identity);
  if(action==='adminListProducts')return (await repository.listProducts()).map(productBrandView).map(publicProduct);
  if(action==='adminSaveProduct'){
    const check=validateProduct(p);if(!check.valid)throw error('INVALID_PRODUCT',check.issues[0]);
    if(!(await repository.listCategories()).some(c=>c.id===p.categoryId))throw error('INVALID_PRODUCT','商品分类不存在');
    const others=(await repository.listProducts()).filter(x=>x.id!==p.id);
    if(p.skus.some(s=>others.some(x=>(x.skus||[]).some(k=>k.id===s.id))))throw error('INVALID_PRODUCT','规格编码已被其他商品使用');
    for(const file of p.images){
      const bundled=/^\/assets\/instruments\/(piano|digital-piano|guitar|guzheng|violin|flute|erhu|drums)-[1-5]\.png$/.test(file);
      if(!bundled&&!await repository.ownsImage(file))throw error('INVALID_IMAGE','请选择本店已上传的商品图片');
    }
    return repository.saveProduct(publicProduct(p),identity.openid);
  }
  if(action==='adminSaveCategory'){
    if(!validId(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>30||!Number.isSafeInteger(p.sort))throw error('INVALID_CATEGORY','请检查分类编码、名称和排序');
    return repository.saveCategory({id:p.id,name:p.name.trim(),sort:p.sort},identity.openid);
  }
  if(action==='adminSaveShop'){const check=validateShop(p);if(!check.valid)throw error('INVALID_SHOP',check.issues[0]);return repository.saveShop(publicShop(p),identity.openid);}
  checkImage(p);return repository.storeImage({base64:p.base64,mime:p.mime},identity.openid);
 }};
}
module.exports={createHandlers,checkImage};
