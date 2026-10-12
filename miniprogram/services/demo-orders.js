const {buildDemoOrder,applyDemoPayment,changeDemoOrderStatus}=require('../domain/demo-orders');
const {validId}=require('../domain/admin');
const {filterDemoOrders}=require('../domain/order-tools');
const {fulfillmentOptions,validateFulfillmentTime,assertFulfillmentTime}=require('../domain/fulfillment-time');
function createDemoOrderService({mode,commerce,readShop,cart,now=()=>new Date().toISOString()}){
 const guard=()=>{if(mode!=='demo'||!commerce)throw Error('模拟订单仅在演示模式可用');};
 const find=(data,id)=>{if(!validId(id))throw Error('订单编码无效');const o=data.orders.find(o=>o.id===id);if(!o)throw Error('订单不存在或已清除');return o;};
 const change=(id,status,actor)=>{guard();return commerce.mutate(d=>{const o=find(d,id),next=changeDemoOrderStatus(o,status,actor,now());d.orders[d.orders.indexOf(o)]=next;return next;});};
 return {
  async fulfillmentOptions(){guard();return fulfillmentOptions(new Date(now()));},
  async adminConfirmTime({id,time}){guard();return commerce.mutate(d=>{const o=find(d,id);if(o.status!=='paid'||!o.desiredTime)throw Error('只有已付款的新订单可以确认交付时间');const candidate=assertFulfillmentTime(time);if(o.confirmedTime&&JSON.stringify(candidate)===JSON.stringify(o.confirmedTime))return o;const stamp=now();o.confirmedTime=validateFulfillmentTime(candidate,new Date(stamp));o.timeConfirmedAt=stamp;return o;});},
  async submit(input){guard();if(!input||!validId(input.requestId)||!validId('demo-'+input.requestId))throw Error('订单请求编码无效');return commerce.mutate(d=>{const old=d.orders.find(o=>o.requestId===input.requestId);if(old)return old;const order=buildDemoOrder(input,{products:d.products,shop:readShop(),id:'demo-'+input.requestId,now:now()});if(order.fromCart){const lines=cart.getLines();for(const item of order.items){const line=lines.find(l=>l.skuId===item.skuId);item.cartGeneration=line?(line.generation||'legacy-'+line.skuId):null;}}d.orders.push(order);return order;});},
  async get(id){guard();return find(commerce.snapshot(),id);},
  async list({query='',status='all'}={}){guard();return filterDemoOrders(commerce.snapshot().orders.slice().reverse(),{query,status});},
  async pay({id,outcome}){guard();let first=false;const order=commerce.mutate(d=>{const old=find(d,id),r=applyDemoPayment(old,d.products,outcome,now());first=old.status==='pending'&&r.order.status==='paid';d.products=r.products;d.orders[d.orders.indexOf(old)]=r.order;return r.order;});let cartCleanupFailed=false;if(first&&order.fromCart){try{cart.consumePurchased(order.items);}catch(e){cartCleanupFailed=true;}}return {order,cartCleanupFailed};},
  async cancel(id){return change(id,'cancelled','customer');},
  async adminSetStatus({id,status}){return change(id,status,'admin');},
  async complete(id){return change(id,'completed','customer');},
  clear(){if(mode!=='demo')return;guard();commerce.mutate(d=>{d.orders=[];});}
 };
}
module.exports={createDemoOrderService};
