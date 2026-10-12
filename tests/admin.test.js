const test=require('node:test'),assert=require('node:assert/strict');
const {validateProduct,validateShop}=require('../server/validation');
const {createHandlers}=require('../server/handlers');
const {createDemoCatalog}=require('../miniprogram/services/demo-catalog');
const {createStorage}=require('../miniprogram/services/storage');
const {memoryRepository,memoryPlatform}=require('./helpers');
const seed=require('../miniprogram/data/demo-catalog');
test('invalidProductCannotSave',()=>{
 const p=seed.products[0];
 for(const bad of [{...p,skus:[]},{...p,shippingType:'normal'},{...p,skus:[{...p.skus[0],stock:-1}]},{...p,skus:[{...p.skus[0],priceFen:1.5}]}])assert.equal(validateProduct(bad).valid,false);
 assert.equal(validateProduct(p).valid,true);assert.equal(validateShop({...seed.shop,shipping:{localFen:-1}}).valid,false);
});
test('adminWritesAreAudited and foreign images rejected',async()=>{
 const repo=memoryRepository(seed),h=createHandlers({repository:repo,identity:{openid:'admin'}});
 await h.handle('adminSaveProduct',{...seed.products[0],title:'演示改名'});
 assert.deepEqual(repo.audit[0],{actor:'admin',action:'product',id:'demo-piano'});
 await assert.rejects(()=>h.handle('adminSaveProduct',{...seed.products[0],images:['cloud://foreign']}),{code:'INVALID_IMAGE'});
});
test('nonAdminUploadDenied and invalid image content rejected',async()=>{
 const repo=memoryRepository(seed),guest=createHandlers({repository:repo,identity:{openid:'guest'}}),admin=createHandlers({repository:repo,identity:{openid:'admin'}});
 await assert.rejects(()=>guest.handle('adminUploadImage',{base64:'',mime:'image/png'}),{code:'FORBIDDEN'});
 await assert.rejects(()=>admin.handle('adminUploadImage',{base64:Buffer.from('not png').toString('base64'),mime:'image/png'}),{code:'INVALID_IMAGE'});
 await assert.rejects(()=>admin.handle('adminUploadImage',{base64:Buffer.alloc(524289).toString('base64'),mime:'image/png'}),{code:'INVALID_IMAGE'});
});
test('demoAdminNeverTouchesCloud and edits persist across restarts',async()=>{
 const s=createStorage(memoryPlatform()),d=createDemoCatalog(s);
 await d.adminSaveProduct({...seed.products[0],status:'inactive'});
 assert.equal((await createDemoCatalog(s).listProducts({})).length,39);
 assert.equal((await d.adminListProducts()).length,40);assert.deepEqual(await d.getAdminAccess(),{allowed:true,demo:true});
 assert.equal(seed.products[0].status,'active');
});
