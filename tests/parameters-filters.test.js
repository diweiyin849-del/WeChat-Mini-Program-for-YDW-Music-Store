const test=require('node:test'),assert=require('node:assert/strict');
const seed=require('../miniprogram/data/demo-catalog');
test('demo parameters survive merchant editing and cloud public projection',async()=>{
 const {memoryPlatform,memoryRepository}=require('./helpers');
 const storage=require('../miniprogram/services/storage').createStorage(memoryPlatform());
 const c=require('../miniprogram/services/demo-catalog').createDemoCatalog(storage);
 const p=await c.getProduct('demo-guitar');assert.ok(p.specs.dimensions.includes('演示'));assert.equal(typeof p.beginnerFriendly,'boolean');
 p.specs.material='用户编辑材料';await c.adminSaveProduct(p);
 assert.equal((await c.getProduct(p.id)).specs.material,'用户编辑材料');
 const handler=require('../server/handlers').createHandlers({repository:memoryRepository({...seed,products:[p]}),identity:{openid:'guest'}});
 assert.equal((await handler.handle('getProduct',{id:p.id})).specs.material,'用户编辑材料');
});
test('price and stock filters must match same SKU and combine with beginner suitability',()=>{
 const {filterProducts}=require('../miniprogram/domain/catalog');
 const p={id:'a',status:'active',beginnerFriendly:true,skus:[{priceFen:10000,stock:0},{priceFen:30000,stock:5}]};
 assert.equal(filterProducts([p],{maxPriceFen:20000,inStockOnly:true}).length,0);
 assert.equal(filterProducts([p],{minPriceFen:30000,maxPriceFen:30000,inStockOnly:true,beginnerOnly:true}).length,1);
 assert.equal(filterProducts([{...p,beginnerFriendly:false}],{beginnerOnly:true}).length,0);
});
test('price input validates decimals, negatives and reversed ranges',()=>{
 const {parseFilters}=require('../miniprogram/view-models/filters');
 assert.deepEqual(parseFilters({minYuan:'',maxYuan:'100.50',inStockOnly:true}),{minPriceFen:undefined,maxPriceFen:10050,inStockOnly:true,beginnerOnly:false});
 for(const value of ['-1','1.234','abc'])assert.throws(()=>parseFilters({minYuan:value}));
 assert.throws(()=>parseFilters({minYuan:'200',maxYuan:'100'}));
});
test('old demo migration fills missing parameters and preserves explicit suitability and material',async()=>{
 const storage=require('../miniprogram/services/storage').createStorage(require('./helpers').memoryPlatform());
 const p={...seed.products.find(p=>p.id==='demo-guitar'),specs:{material:'店主材料'},beginnerFriendly:false};
 storage.write('demo-products',[p]);storage.write('demo-catalog-revision',2);
 const c=require('../miniprogram/services/demo-catalog').createDemoCatalog(storage),result=await c.getProduct(p.id);
 assert.equal(result.specs.material,'店主材料');assert.equal(result.beginnerFriendly,false);assert.ok(result.specs.dimensions.includes('演示'));
});
