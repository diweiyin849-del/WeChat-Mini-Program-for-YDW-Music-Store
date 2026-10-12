const test=require('node:test'),assert=require('node:assert/strict');
const {createQuoteController}=require('../miniprogram/view-models/checkout');
const {buildCartView}=require('../miniprogram/view-models/cart');
const {products}=require('../miniprogram/data/demo-catalog');
test('latestQuoteWins',async()=>{
 const resolvers=[],updates=[];
 const c=createQuoteController({quote:()=>new Promise(resolve=>resolvers.push(resolve))},x=>updates.push(x));
 const a=c.update({id:1}),b=c.update({id:2});resolvers[1]({valid:true,totalFen:100});await b;resolvers[0]({valid:true,totalFen:999});await a;
 assert.equal(updates.at(-1).quote.totalFen,100);assert.equal(updates.filter(x=>x.quote&&x.quote.totalFen===999).length,0);
});
test('invalidCartLinesStayVisibleButCannotQuote; empty cart cannot preview',()=>{
 assert.equal(buildCartView([],products).canPreview,false);
 const missing=buildCartView([{skuId:'removed',quantity:1,selected:true}],products);
 assert.equal(missing.canPreview,false);assert.equal(missing.items.length,1);assert.equal(missing.issues[0].code,'SKU_UNAVAILABLE');
 const good=buildCartView([{skuId:'sku-guitar-standard',quantity:2,selected:true}],products);
 assert.equal(good.subtotalFen,136000);assert.equal(good.canPreview,true);
});
test('pickupSwitchRecalculates after outside region',async()=>{
 const {createDemoCatalog}=require('../miniprogram/services/demo-catalog');
 const service=createDemoCatalog(),updates=[],c=createQuoteController(service,v=>updates.push(v));
 const lines=[{skuId:'sku-guitar-standard',quantity:1,expectedPriceFen:68000}];
 await c.update({lines,fulfillment:'delivery',region:{provinceCode:'110000',cityCode:'110100',districtCode:'110101'}});
 assert.equal(updates.at(-1).quote.valid,true);assert.equal(updates.at(-1).quote.totalFen,88000);
 await c.update({lines,fulfillment:'pickup',region:null});assert.equal(updates.at(-1).quote.totalFen,68000);
});
test('invalidating checkout discards pending quote result',async()=>{
 let resolve;const updates=[],c=createQuoteController({quote:()=>new Promise(r=>{resolve=r;})},v=>updates.push(v));
 const pending=c.update({});c.invalidate();resolve({valid:true,totalFen:999});await pending;
 assert.equal(updates.at(-1).quote,null);assert.equal(updates.at(-1).loading,false);
});
