const test=require('node:test'),assert=require('node:assert/strict');
const {createHandlers}=require('../server/handlers');
const {createCloudCatalog}=require('../miniprogram/services/cloud-catalog');
const {memoryRepository}=require('./helpers');
const seed=require('../miniprogram/data/demo-catalog');
test('cloudQuoteUsesServerPrices and quoting makes no writes',async()=>{
 const repo=memoryRepository(seed),h=createHandlers({repository:repo,identity:{openid:'guest'}});
 const q=await h.handle('quote',{lines:[{skuId:'sku-guitar-standard',quantity:1,expectedPriceFen:1}],fulfillment:'pickup',region:null});
 assert.equal(q.valid,false);assert.equal(q.issues[0].code,'PRICE_CHANGED');assert.equal(q.items[0].priceFen,68000);assert.equal(repo.audit.length,0);
 await assert.rejects(()=>h.handle('createOrder',{}),{code:'UNKNOWN_ACTION'});
});
test('nonAdminCannotWrite and forgedIdentityIgnored',async()=>{
 const h=createHandlers({repository:memoryRepository(seed),identity:{openid:'guest'}});
 for(const action of ['adminSaveProduct','adminSaveCategory','adminSaveShop','adminUploadImage','adminListProducts'])
   await assert.rejects(()=>h.handle(action,{...seed.shop,openid:'admin'}),{code:'FORBIDDEN'});
 assert.deepEqual(await h.handle('getAdminAccess',{}),{allowed:false});
});
test('publicCatalogHidesInactiveProducts and administrator can still list them',async()=>{
 const repo=memoryRepository(seed);repo.data.products[0].status='inactive';
 const guest=createHandlers({repository:repo,identity:{openid:'guest'}}),admin=createHandlers({repository:repo,identity:{openid:'admin'}});
 assert.equal((await guest.handle('listProducts',{})).length,39);
 assert.equal(await guest.handle('getProduct',{id:seed.products[0].id}),null);
 assert.equal((await admin.handle('adminListProducts',{})).length,40);
});
test('quotePayloadOmitsPersonalAddress and cloud failures never use demo data',async()=>{
 let sent;
 const service=createCloudCatalog({cloud:{callFunction:async x=>{sent=x.data;return {result:{ok:true,data:{valid:true}}};}}});
 await service.quote({lines:[],fulfillment:'delivery',region:{provinceCode:'650000',cityCode:'650500',districtCode:'650502',detail:'私人住址'},phone:'13800000000',detail:'私人住址'});
 assert.deepEqual(sent.payload,{lines:[],fulfillment:'delivery',region:{provinceCode:'650000',cityCode:'650500',districtCode:'650502'}});
 const failing=createCloudCatalog({cloud:{callFunction:async()=>{throw new Error('网络失败');}}});
 await assert.rejects(()=>failing.listProducts({}),/网络失败/);
});
