const test = require('node:test');
const assert = require('node:assert/strict');
const { filterProducts, getMinPriceFen } = require('../miniprogram/domain/catalog');
const { categories, products } = require('../miniprogram/data/demo-catalog');
const { getCategorySummaries } = require('../miniprogram/domain/catalog');

test('category totals count active models and sum stock across specifications', () => {
  const summary = getCategorySummaries([{id:'guitar',name:'吉他'},{id:'piano',name:'钢琴'}], [
    {categoryId:'guitar',status:'active',images:['/guitar.png'],skus:[{stock:3},{stock:2}]},
    {categoryId:'guitar',status:'active',images:[],skus:[{stock:0}]},
    {categoryId:'guitar',status:'inactive',images:[],skus:[{stock:100}]}
  ]);
  assert.equal(summary[0].modelCount,2);
  assert.equal(summary[0].stockCount,5);
  assert.equal(summary[0].unit,'把');
  assert.equal(summary[0].image,'/guitar.png');
  assert.equal(summary[1].modelCount,0);
  assert.equal(summary[1].stockCount,0);
});

test('demo customers can browse five illustrated models with five units in each category', async () => {
  const {createDemoCatalog}=require('../miniprogram/services/demo-catalog');
  const catalog=createDemoCatalog();
  const fs=require('node:fs'),path=require('node:path');
  for(const c of categories){
    const list=await catalog.listProducts({categoryId:c.id});
    assert.equal(list.length,5);
    assert.equal(new Set(list.map(p=>p.model)).size,5);
    for(const p of list){
      assert.equal(p.skus.reduce((sum,s)=>sum+s.stock,0),5);
      assert.ok(p.images.length>0);
      const file=path.join(__dirname,'../miniprogram',p.images[0]);
      assert.ok(fs.existsSync(file),'missing image: '+p.images[0]);
      assert.equal(fs.readFileSync(file).subarray(1,4).toString(),'PNG');
    }
  }
});

test('catalogHasEightCategories and demoDataIsExplicit', () => {
  assert.deepEqual(categories.map(c => c.name), ['钢琴','电钢琴','吉他','古筝','小提琴','笛子','二胡','电子鼓']);
  assert.equal(new Set(categories.map(c => c.id)).size, 8);
  assert.ok(products.every(p => p.title.includes('演示')));
  assert.equal(products.find(p => p.categoryId === 'piano').shippingType, 'piano');
  assert.equal(products.find(p => p.categoryId === 'digital-piano').shippingType, 'normal');
});
test('searchMatchesTitleBrandModel and hides inactive products', () => {
  const list = [{id:'a', title:'古典吉他', brand:'演示品牌', model:'C40', categoryId:'guitar', status:'active', skus:[{priceFen:10000}]},
    {id:'b', title:'吉他', status:'inactive', skus:[{priceFen:5000}]}];
  assert.deepEqual(filterProducts(list,{keyword:' c40 '}).map(p=>p.id), ['a']);
  assert.equal(filterProducts(list,{keyword:'演示品牌',categoryId:'guitar'}).length,1);
  assert.equal(filterProducts(list,{categoryId:'piano'}).length,0);
});
test('priceSortUsesCheapestSku', () => {
  const list = [{id:'a',status:'active',skus:[{priceFen:30000},{priceFen:10000}]}, {id:'b',status:'active',skus:[{priceFen:20000}]}];
  assert.equal(getMinPriceFen(list[0]),10000);
  assert.deepEqual(filterProducts(list,{sort:'price-desc'}).map(p=>p.id),['b','a']);
  assert.deepEqual(list.map(p=>p.id),['a','b']);
});

test('older saved demo catalog gains new models without overwriting merchant edits',async()=>{
 const {createDemoCatalog}=require('../miniprogram/services/demo-catalog');
 const {createStorage}=require('../miniprogram/services/storage');
 const {memoryPlatform}=require('./helpers');
 const storage=createStorage(memoryPlatform());
 storage.write('demo-products',[{...products.find(p=>p.id==='demo-guitar'),title:'店主修改',images:[],skus:[{id:'sku-guitar-standard',productId:'demo-guitar',label:'自定义',priceFen:79900,stock:1}]}]);
 const catalog=createDemoCatalog(storage);
 assert.equal((await catalog.listProducts({})).length,40);
 const guitar=await catalog.getProduct('demo-guitar');
 assert.equal(guitar.title,'店主修改');assert.equal(guitar.skus[0].stock,1);assert.equal(guitar.skus[0].priceFen,79900);
 assert.ok(guitar.images[0].endsWith('guitar-1.png'));
 await catalog.adminSaveProduct({...guitar,status:'inactive'});
 assert.equal((await createDemoCatalog(storage).listProducts({})).length,39);
});
