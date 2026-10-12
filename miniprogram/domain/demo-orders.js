const {buildQuote}=require('./quote');
const {validateAddress}=require('./address');
const {validId}=require('./admin');
const {validateFulfillmentTime,assertFulfillmentTime}=require('./fulfillment-time');
const copy=v=>JSON.parse(JSON.stringify(v));
function assertDemoOrder(o){
 const fail=()=>{throw Error('本机订单记录损坏，请备份后检查');};
 if(!o||!validId(o.id)||!validId(o.requestId)||!['pending','paid','shipped','completed','cancelled'].includes(o.status)||!['pickup','delivery'].includes(o.fulfillment)||typeof o.createdAt!=='string'||!o.createdAt||typeof o.fromCart!=='boolean'||typeof o.contact!=='string'||!o.contact.trim()||o.contact.length>30||typeof o.phone!=='string'||!/^\+?\d{7,15}$/.test(o.phone)||!Array.isArray(o.items)||!o.items.length)fail();
 if(o.fulfillment==='delivery'&&(!validateAddress(o.address).valid||o.address.contact.length>30||o.address.detail.length>200))fail();
 let subtotal=0;const ids=new Set();
 for(const i of o.items){if(!i||!validId(i.skuId)||!validId(i.productId)||ids.has(i.skuId)||typeof i.title!=='string'||typeof i.label!=='string'||typeof i.image!=='string'||!Number.isSafeInteger(i.quantity)||i.quantity<=0||!Number.isSafeInteger(i.priceFen)||i.priceFen<=0||!Number.isSafeInteger(i.lineTotalFen)||i.lineTotalFen!==i.quantity*i.priceFen)fail();ids.add(i.skuId);subtotal+=i.lineTotalFen;}
 if(!Number.isSafeInteger(subtotal)||o.subtotalFen!==subtotal||!Number.isSafeInteger(o.shippingFen)||o.shippingFen<0||!Number.isSafeInteger(o.totalFen)||o.totalFen!==subtotal+o.shippingFen||(o.fulfillment==='pickup'&&o.shippingFen!==0))fail();
 if(['paid','shipped','completed'].includes(o.status)&&(typeof o.paidAt!=='string'||!o.paidAt))fail();
 if(o.status==='shipped'&&o.fulfillment!=='delivery')fail();
 if(o.desiredTime!==undefined)assertFulfillmentTime(o.desiredTime);
 if(o.desiredTime!==undefined&&['shipped','completed'].includes(o.status)&&(o.confirmedTime===undefined||o.timeConfirmedAt===undefined))fail();
 if(o.confirmedTime!==undefined||o.timeConfirmedAt!==undefined){if(o.desiredTime===undefined||o.confirmedTime===undefined||typeof o.timeConfirmedAt!=='string'||!Number.isFinite(Date.parse(o.timeConfirmedAt))||!['paid','shipped','completed'].includes(o.status))fail();assertFulfillmentTime(o.confirmedTime);}
}
function buildDemoOrder(input,{products,shop,id,now}){
 if(!input||!validId(input.requestId)||!validId(id))throw Error('订单请求编码无效');
 const desiredTime=validateFulfillmentTime(input.desiredTime,new Date(now));
 const q=buildQuote({input:{...input,region:input.address},products,shop});
 if(!q.valid)throw Error(q.issues[0].message);
 if(!Number.isSafeInteger(input.expectedTotalFen)||input.expectedTotalFen!==q.totalFen)throw Error('费用已变化，请刷新后确认');
 let contact,phone,address=null;
 if(input.fulfillment==='delivery'){
  const a=input.address,check=validateAddress(a);if(!check.valid)throw Error(check.issues[0]);
  if(a.contact.trim().length>30||a.detail.trim().length>200)throw Error('联系人最多30字，详细地址最多200字');
  address={contact:a.contact.trim(),phone:a.phone,detail:a.detail.trim(),provinceCode:a.provinceCode,cityCode:a.cityCode,districtCode:a.districtCode,regionNames:copy(a.regionNames||[])};
  contact=address.contact;phone=address.phone;
 }else{
  contact=typeof input.contact==='string'?input.contact.trim():'';phone=typeof input.phone==='string'?input.phone.trim():'';
  if(!contact||contact.length>30||!/^\+?\d{7,15}$/.test(phone))throw Error('请填写30字以内联系人及7至15位电话（可加+号）');
 }
 const items=q.items.map(item=>{const p=products.find(p=>p.skus.some(s=>s.id===item.skuId));return {...item,productId:p.id,image:(p.images||[])[0]||''};});
 return {id,requestId:input.requestId,status:'pending',createdAt:now,items,subtotalFen:q.subtotalFen,shippingFen:q.shippingFen,totalFen:q.totalFen,fulfillment:input.fulfillment,contact,phone,address,fromCart:input.fromCart===true,desiredTime};
}
function applyDemoPayment(order,products,outcome,now){
 assertDemoOrder(order);
 if(!['success','failure','cancel'].includes(outcome))throw Error('模拟付款结果无效');
 const o=copy(order),all=copy(products);
 if(o.status==='paid'&&outcome==='success')return {order:o,products:all};
 if(o.status!=='pending')throw Error('当前订单不能付款');
 if(outcome!=='success')return {order:o,products:all};
 const changed=new Set();
 for(const item of o.items){const p=all.find(p=>p.id===item.productId&&p.status==='active'),sku=p&&p.skus.find(s=>s.id===item.skuId);
  if(!sku)throw Error('商品已下架或规格不存在');
  if(!Number.isSafeInteger(sku.stock)||sku.stock<item.quantity)throw Error('商品库存不足');
  sku.stock-=item.quantity;
  changed.add(p);
 }
 for(const p of changed)p.demoRevision=(p.demoRevision||0)+1;
 o.status='paid';o.paidAt=now;return {order:o,products:all};
}
function changeDemoOrderStatus(order,target,actor,now){
 assertDemoOrder(order);
 if(!['customer','admin'].includes(actor))throw Error('无权管理订单');
 const allowed=(order.status==='pending'&&target==='cancelled')||(order.status==='shipped'&&target==='completed')||(actor==='admin'&&order.status==='paid'&&((order.fulfillment==='delivery'&&target==='shipped')||(order.fulfillment==='pickup'&&target==='completed')));
 if(!allowed)throw Error('当前订单不支持此操作');
 if(order.status==='paid'&&order.desiredTime&&!order.confirmedTime)throw Error('请先确认顾客期望交付时间');
 return {...copy(order),status:target,[target+'At']:now};
}
module.exports={buildDemoOrder,applyDemoPayment,changeDemoOrderStatus,assertDemoOrder};
