const clone=value=>value===undefined?undefined:JSON.parse(JSON.stringify(value));
const {validateProduct}=require('../domain/admin');
const {assertDemoOrder}=require('../domain/demo-orders');
function validate(data){
 if(!data||data.schema!==1||!Array.isArray(data.products)||!Array.isArray(data.orders))throw new Error('本机交易记录损坏，请备份后检查，不能自动恢复库存');
 const ids=new Set(),skus=new Set(),orders=new Set(),requests=new Set();
 for(const p of data.products){if(!validateProduct(p).valid||ids.has(p.id)||!Number.isSafeInteger(p.demoRevision||0)||(p.demoRevision||0)<0)throw Error('本机商品记录损坏，请备份后检查');ids.add(p.id);for(const s of p.skus){if(skus.has(s.id))throw Error('本机规格记录损坏');skus.add(s.id);}}
 for(const o of data.orders){assertDemoOrder(o);if(orders.has(o.id)||requests.has(o.requestId))throw Error('本机订单记录重复，请备份后检查');orders.add(o.id);requests.add(o.requestId);}
}
function createDemoCommerce(storage,loadLegacyProducts){
 function snapshot(){
  let data=storage.readStrict('demo-commerce',undefined);
  if(data===undefined){data={schema:1,products:clone(loadLegacyProducts()),orders:[]};validate(data);storage.write('demo-commerce',clone(data));}
  validate(data);
  return clone(data);
 }
 return {snapshot,mutate(update){const data=snapshot(),result=update(data);if(result&&typeof result.then==='function')throw new Error('交易更新必须同步');validate(data);storage.write('demo-commerce',clone(data));return clone(result);}};
}
module.exports={createDemoCommerce};
