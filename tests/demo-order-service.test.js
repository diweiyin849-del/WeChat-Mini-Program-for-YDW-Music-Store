const test=require('node:test'),assert=require('node:assert/strict');
const {memoryPlatform}=require('./helpers'),{createStorage}=require('../miniprogram/services/storage'),{createDemoCatalog}=require('../miniprogram/services/demo-catalog'),{createCartService}=require('../miniprogram/services/cart');
const {createDemoOrderService}=require('../miniprogram/services/demo-orders');
function setup(){const p=memoryPlatform(),s=createStorage(p),cat=createDemoCatalog(s),cart=createCartService(s);const orders=createDemoOrderService({mode:'demo',commerce:cat.demoCommerce,readShop:cat.demoShop,cart,now:()=> '2026-10-12T16:30:00Z'});return {p,s,cat,cart,orders};}
const input={requestId:'one',lines:[{skuId:'sku-guitar-standard',quantity:1,expectedPriceFen:68000}],fulfillment:'pickup',contact:'顾客',phone:'+12125551234',expectedTotalFen:68000,fromCart:true,desiredTime:{date:'2026-10-13',time:'10:00',timeZone:'America/New_York'}};
test('concurrent success pays once, preserves cart additions and administration, and clear retains deducted stock',async()=>{
 const x=setup();x.cart.setQuantity('sku-guitar-standard',3);x.cart.setQuantity('other',1);
 const a=await x.orders.submit(input);assert.equal((await x.orders.submit({...input,expectedTotalFen:1})).id,a.id);
 const product=await x.cat.getProduct('demo-guitar');product.skus[0].stock=1;await x.cat.adminSaveProduct(product);
 const b=await x.orders.submit({...input,requestId:'two',fromCart:false});
 await Promise.all([x.orders.pay({id:a.id,outcome:'success'}),x.orders.pay({id:a.id,outcome:'success'})]);
 await assert.rejects(()=>x.orders.pay({id:b.id,outcome:'success'}),/库存/);
 assert.equal(x.cart.getLines().find(l=>l.skuId==='sku-guitar-standard').quantity,2);assert.equal(x.cart.getLines().find(l=>l.skuId==='other').quantity,1);
 const latest=await x.cat.getProduct('demo-guitar');latest.title='改名';await x.cat.adminSaveProduct(latest);
 assert.equal((await x.orders.get(a.id)).items[0].title,product.title);assert.equal((await x.orders.list()).length,2);
 x.orders.clear();assert.equal((await x.orders.list()).length,0);assert.equal((await x.cat.getProduct('demo-guitar')).skus[0].stock,0);
});
test('write failure stays pending and cart cleanup failure does not undo paid',async()=>{
 const x=setup(),o=await x.orders.submit(input),write=x.p.setStorageSync;
 x.p.setStorageSync=()=>{throw Error('full');};await assert.rejects(()=>x.orders.pay({id:o.id,outcome:'success'}),/full/);
 assert.equal((await x.orders.get(o.id)).status,'pending');assert.equal((await x.cat.getProduct('demo-guitar')).skus[0].stock,5);
 x.p.setStorageSync=write;x.cart.consumePurchased=()=>{throw Error('cart full');};
 const r=await x.orders.pay({id:o.id,outcome:'success'});assert.equal(r.order.status,'paid');assert.equal(r.cartCleanupFailed,true);
 assert.equal((await x.orders.pay({id:o.id,outcome:'success'})).cartCleanupFailed,false);
});
test('restart deduplicates and cloud refuses without any storage writes',async()=>{
 const x=setup();await x.orders.submit(input);
 const again=createDemoOrderService({mode:'demo',commerce:x.cat.demoCommerce,readShop:x.cat.demoShop,cart:x.cart,now:()=> '2026-10-12T17:00:00Z'});
 assert.equal((await again.submit(input)).createdAt,'2026-10-12T16:30:00Z');assert.equal((await again.list()).length,1);
 const cloud=createDemoOrderService({mode:'cloud'});await assert.rejects(()=>cloud.submit(input),/演示/);await assert.rejects(()=>cloud.list(),/演示/);cloud.clear();
 assert.equal((await again.list()).length,1);
 await again.cancel('demo-one');await assert.rejects(()=>again.pay({id:'demo-one',outcome:'success'}));
});
test('stale merchant snapshot cannot restore paid stock',async()=>{
 const x=setup(),old=await x.cat.getProduct('demo-guitar'),o=await x.orders.submit({...input,fromCart:false});
 await x.orders.pay({id:o.id,outcome:'success'});old.title='改名';await assert.rejects(()=>x.cat.adminSaveProduct(old),/变化|刷新/);
 assert.equal((await x.cat.getProduct(old.id)).skus[0].stock,4);
 const fresh=await x.cat.getProduct(old.id);fresh.title='重新改名';await x.cat.adminSaveProduct(fresh);assert.equal((await x.cat.getProduct(old.id)).skus[0].stock,4);
});
test('corrupt present or nested transaction data never restores or increases stock',async()=>{
 for(const corrupt of [()=>null,()=>({version:1,data:undefined}),d=>({version:1,data:{...d,orders:d.orders.map(o=>({...o,items:o.items.map(i=>({...i,quantity:-1}))}))}})]){
  const x=setup();await x.orders.submit(input);const data=x.cat.demoCommerce.snapshot();x.p.setStorageSync('heqisheng.preview.v1.demo-commerce',corrupt(data));
  await assert.rejects(()=>x.orders.pay({id:'demo-one',outcome:'success'}));assert.throws(()=>x.cat.demoCommerce.snapshot());
 }
});
test('payment preserves a newly added cart line after original line was removed',async()=>{
 const x=setup();x.cart.setQuantity('sku-guitar-standard',2,68000);const o=await x.orders.submit({...input,lines:[{skuId:'sku-guitar-standard',quantity:2,expectedPriceFen:68000}],expectedTotalFen:136000});
 x.cart.remove('sku-guitar-standard');x.cart.setQuantity('sku-guitar-standard',1,68000);await x.orders.pay({id:o.id,outcome:'success'});
 assert.equal(x.cart.getLines()[0].quantity,1);
});
test('new orders require time and merchant confirms idempotently before fulfillment',async()=>{
 const x=setup(),time={date:'2026-10-13',time:'10:00',timeZone:'America/New_York'};
 await assert.rejects(()=>x.orders.submit({...input,requestId:'no-time',desiredTime:undefined}),/时间/);
 const o=await x.orders.submit({...input,requestId:'timed',desiredTime:time,fromCart:false});await assert.rejects(()=>x.orders.adminConfirmTime({id:o.id,time}));
 await x.orders.pay({id:o.id,outcome:'success'});await assert.rejects(()=>x.orders.adminSetStatus({id:o.id,status:'completed'}),/确认/);
 const r=await x.orders.adminConfirmTime({id:o.id,time});assert.deepEqual(r.confirmedTime,time);assert.equal(r.status,'paid');const twice=await x.orders.adminConfirmTime({id:o.id,time});assert.equal(twice.timeConfirmedAt,r.timeConfirmedAt);assert.equal((await x.cat.getProduct('demo-guitar')).skus[0].stock,4);
 await x.orders.adminSetStatus({id:o.id,status:'completed'});await assert.rejects(()=>x.orders.adminConfirmTime({id:o.id,time}));
});
test('legacy orders and expired confirmed times remain readable, confirmation writes fail atomically',async()=>{
 const x=setup(),time={date:'2026-10-13',time:'10:00',timeZone:'America/New_York'},o=await x.orders.submit({...input,desiredTime:time,fromCart:false});
 await x.orders.pay({id:o.id,outcome:'success'});const write=x.p.setStorageSync;x.p.setStorageSync=()=>{throw Error('full');};await assert.rejects(()=>x.orders.adminConfirmTime({id:o.id,time}),/full/);x.p.setStorageSync=write;assert.equal((await x.orders.get(o.id)).confirmedTime,undefined);
 await x.orders.adminConfirmTime({id:o.id,time});const late=createDemoOrderService({mode:'demo',commerce:x.cat.demoCommerce,readShop:x.cat.demoShop,now:()=> '2027-01-01T00:00:00Z'});assert.equal((await late.get(o.id)).status,'paid');
 x.cat.demoCommerce.mutate(d=>{delete d.orders[0].desiredTime;delete d.orders[0].confirmedTime;delete d.orders[0].timeConfirmedAt;});await x.orders.adminSetStatus({id:o.id,status:'completed'});assert.equal((await x.orders.get(o.id)).status,'completed');
});
test('timed fulfilled records missing confirmation are rejected while legacy terminal records survive',async()=>{
 for(const status of ['shipped','completed']){
  const x=setup(),time=input.desiredTime,o=await x.orders.submit({...input,fromCart:false,fulfillment:'delivery',address:{contact:'顾客',phone:'13800000000',provinceCode:'650000',cityCode:'650500',districtCode:'650502',detail:'1号',regionNames:['美国','纽约','示意区']}});
  await x.orders.pay({id:o.id,outcome:'success'});await x.orders.adminConfirmTime({id:o.id,time});await x.orders.adminSetStatus({id:o.id,status:'shipped'});if(status==='completed')await x.orders.complete(o.id);
  const late=createDemoOrderService({mode:'demo',commerce:x.cat.demoCommerce,now:()=> '2027-01-01T00:00:00Z'});assert.equal((await late.get(o.id)).status,status);
  const broken=x.cat.demoCommerce.snapshot();delete broken.orders[0].confirmedTime;delete broken.orders[0].timeConfirmedAt;x.s.write('demo-commerce',broken);
  await assert.rejects(()=>x.orders.get(o.id),/损坏/);await assert.rejects(()=>x.orders.complete(o.id),/损坏/);
  delete broken.orders[0].desiredTime;x.s.write('demo-commerce',broken);assert.equal((await x.orders.get(o.id)).status,status);
 }
});
