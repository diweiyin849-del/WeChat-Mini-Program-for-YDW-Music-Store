const test=require('node:test'),assert=require('node:assert/strict');
const {createStorage}=require('../miniprogram/services/storage');
const {memoryPlatform}=require('./helpers');
const {createDemoCommerce}=require('../miniprogram/services/demo-commerce');
const {createDemoCatalog}=require('../miniprogram/services/demo-catalog');
const seed=require('../miniprogram/data/demo-catalog');
const {buildDemoOrder}=require('../miniprogram/domain/demo-orders');
const legacy=()=>JSON.parse(JSON.stringify(seed.products));
const order=(products,id)=>buildDemoOrder({requestId:id,lines:[{skuId:'sku-guitar-standard',quantity:1,expectedPriceFen:68000}],fulfillment:'pickup',contact:'顾客',phone:'12125551234',expectedTotalFen:68000,desiredTime:{date:'2026-10-13',time:'10:00',timeZone:'America/New_York'}},{products,shop:seed.shop,id,now:'2026-10-12T16:30:00Z'});
test('commerce migrates once, isolates copies, and commits atomically',()=>{
 const p=memoryPlatform(),s=createStorage(p);let loads=0;
 const c=createDemoCommerce(s,()=>{loads++;const p=legacy();p[0].skus[0].stock=2;return p;});
 c.mutate(d=>{d.orders.push(order(d.products,'o'));});
 const copy=c.snapshot();copy.products[0].skus[0].stock=99;
 assert.equal(c.snapshot().products[0].skus[0].stock,2);assert.equal(loads,1);
 const before=c.snapshot();p.setStorageSync=()=>{throw Error('full');};
 assert.throws(()=>c.mutate(d=>{d.products[0].skus[0].stock=1;d.orders[0].status='paid';d.orders[0].paidAt='now';}),/full/);
 assert.deepEqual(c.snapshot(),before);
 assert.throws(()=>c.mutate(async()=>{}),/同步/);
});
test('damaged commerce refuses recovery and strict reads preserve the evidence',()=>{
 const p=memoryPlatform(),s=createStorage(p);
 p.setStorageSync('heqisheng.preview.v1.demo-commerce',{version:1,data:{schema:9,products:[],orders:[]}});
 assert.throws(()=>createDemoCommerce(s,()=>[]).snapshot(),/损坏/);
 p.setStorageSync('heqisheng.preview.v1.broken','bad');
 assert.throws(()=>s.readStrict('broken',null));assert.equal(p.getStorageSync('heqisheng.preview.v1.broken'),'bad');
 assert.equal(s.readStrict('absent',null),null);
});
test('catalog preserves edited legacy stock and orders through admin changes and restart',async()=>{
 const s=createStorage(memoryPlatform()),seed=require('../miniprogram/data/demo-catalog');
 const p=JSON.parse(JSON.stringify(seed.products[0]));p.skus[0].priceFen=79999;p.skus[0].stock=2;p.status='inactive';
 s.write('demo-products',[p]);const cat=createDemoCatalog(s);
 const migrated=(await cat.adminListProducts()).find(x=>x.id===p.id);
 assert.equal(migrated.skus[0].priceFen,79999);assert.equal(migrated.skus[0].stock,2);assert.equal(migrated.status,'inactive');
 cat.demoCommerce.mutate(d=>d.orders.push(order(d.products,'kept')));
 migrated.skus[0].stock=1;await cat.adminSaveProduct({...migrated,status:'active'});
 const restarted=createDemoCatalog(s);assert.equal(restarted.demoCommerce.snapshot().orders[0].id,'kept');
 assert.equal((await restarted.getProduct(p.id)).skus[0].stock,1);
});
