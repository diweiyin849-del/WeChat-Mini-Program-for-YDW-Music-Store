const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeShop}=require('../miniprogram/domain/shop-config');
const {validateShop}=require('../miniprogram/domain/admin');
const {calculateShipping}=require('../miniprogram/domain/shipping');
const {createDemoCatalog}=require('../miniprogram/services/demo-catalog');
const {createStorage}=require('../miniprogram/services/storage');
const {memoryPlatform,memoryRepository}=require('./helpers');
const seed=require('../miniprogram/data/demo-catalog');
test('old shop gains only missing defaults, YDW name and preserves explicit zero',()=>{
 const old={...seed.shop,name:'和齐升琴行',phone:'custom',shipping:{localFen:12345,regionalFen:10000,pianoFen:30000}};
 const s=normalizeShop(old);assert.equal(s.name,'YDW琴行');assert.equal(s.phone,'custom');assert.equal(s.shipping.localFen,12345);assert.equal(s.shipping.internationalFen,20000);assert.equal(s.shipping.internationalPianoFen,60000);assert.equal(s.lowStockThreshold,2);assert.equal(old.name,'和齐升琴行');
 const zero=normalizeShop({...s,lowStockThreshold:0,shipping:{...s.shipping,internationalFen:0}});assert.equal(zero.lowStockThreshold,0);assert.equal(zero.shipping.internationalFen,0);
 for(const bad of [{...s,lowStockThreshold:10000},{...s,lowStockThreshold:'2'},{...s,shipping:{...s.shipping,internationalFen:-1}}])assert.equal(validateShop(bad).valid,false);
 assert.equal(validateShop(s).valid,true);
});
test('international prices use valid regions and one piano rate without stacking',()=>{
 const shop=normalizeShop(seed.shop),region={provinceCode:'110000',cityCode:'110100',districtCode:'110101'};
 assert.equal(calculateShipping({fulfillment:'delivery',region,shipping:shop.shipping,hasPiano:false}).shippingFen,20000);
 assert.equal(calculateShipping({fulfillment:'delivery',region,shipping:shop.shipping,hasPiano:true}).shippingFen,60000);
 assert.equal(calculateShipping({fulfillment:'pickup',region,shipping:shop.shipping,hasPiano:true}).shippingFen,0);
 assert.equal(calculateShipping({fulfillment:'delivery',region:{...region,districtCode:'650502'},shipping:shop.shipping}).supported,false);
});
test('brand and shop views rename legacy data without touching order snapshots or stock',async()=>{
 const storage=createStorage(memoryPlatform()),cat=createDemoCatalog(storage);const p=await cat.getProduct('demo-guitar');p.brand='和齐升 · 演示资料';p.skus[0].stock=4;await cat.adminSaveProduct(p);
 storage.write('demo-shop',{...seed.shop,name:'和齐升琴行',phone:'13800000000'});
 assert.equal((await cat.getShop()).name,'YDW琴行');assert.equal((await cat.getShop()).phone,'13800000000');
 assert.equal((await cat.getProduct(p.id)).brand,'YDW · 演示资料');assert.equal((await cat.getProduct(p.id)).skus[0].stock,4);
 assert.ok((await cat.listProducts({keyword:'YDW'})).some(x=>x.id===p.id));assert.equal((await cat.listProducts({keyword:'不存在的品牌'})).length,0);
 const {createHandlers}=require('../server/handlers'),repo=memoryRepository({...seed,shop:{...seed.shop,name:'和齐升琴行'}}),h=createHandlers({repository:repo,identity:{openid:'admin'}});
 assert.equal((await h.handle('getShop')).name,'YDW琴行');await h.handle('adminSaveShop',normalizeShop(seed.shop));assert.equal(repo.data.shop.name,'YDW琴行');
});
