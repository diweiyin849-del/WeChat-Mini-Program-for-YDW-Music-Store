const test=require('node:test'),assert=require('node:assert/strict');
const {filterDemoOrders,lowStockItems}=require('../miniprogram/domain/order-tools');
test('order status and snapshot search intersect without mutation',()=>{
 const rows=[{id:'demo-a',status:'paid',contact:'张三',items:[{title:'Guitar old name',label:'标准'}]},{id:'demo-b',status:'pending',contact:'李四',items:[{title:'Guitar',label:'套装'}]}];
 assert.deepEqual(filterDemoOrders(rows,{query:' GUItar ',status:'paid'}).map(x=>x.id),['demo-a']);
 assert.deepEqual(filterDemoOrders(rows,{query:'李四',status:'all'}).map(x=>x.id),['demo-b']);assert.equal(filterDemoOrders(rows,{query:'zzz'}).length,0);assert.equal(filterDemoOrders(rows,{}).length,2);assert.throws(()=>filterDemoOrders(rows,{status:'bogus'}));assert.equal(rows.length,2);
});
test('stock alerts count individual active SKUs at strict threshold',()=>{
 const p=[{id:'p',title:'吉他',status:'active',skus:[{id:'a',label:'A',stock:1},{id:'b',label:'B',stock:5},{id:'c',label:'C',stock:2},{id:'d',label:'D',stock:0}]},{id:'q',status:'inactive',skus:[{id:'e',stock:0}]}];
 const items=lowStockItems(p,2);assert.deepEqual(items.map(x=>x.skuId),['a','d']);assert.equal(items[1].soldOut,true);assert.equal(lowStockItems(p,0).length,0);for(const n of [-1,1.5,10000,'2'])assert.throws(()=>lowStockItems(p,n));
});
