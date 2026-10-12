function filterDemoOrders(orders,{query='',status='all'}={}){
 if(!['all','pending','paid','shipped','completed','cancelled'].includes(status))throw Error('订单筛选状态无效');
 const word=String(query).trim().toLowerCase();
 return orders.filter(o=>(status==='all'||o.status===status)&&(!word||[o.id,o.contact,...o.items.flatMap(i=>[i.title,i.label])].join(' ').toLowerCase().includes(word)));
}
function lowStockItems(products,threshold){
 if(!Number.isSafeInteger(threshold)||threshold<0||threshold>9999)throw Error('库存预警阈值须为0至9999整数');
 if(threshold===0)return [];
 return products.filter(p=>p.status==='active').flatMap(p=>p.skus.filter(s=>{if(!Number.isSafeInteger(s.stock)||s.stock<0)throw Error('商品库存异常');return s.stock<threshold;}).map(s=>({productId:p.id,skuId:s.id,title:p.title,label:s.label,stock:s.stock,soldOut:s.stock===0})));
}
module.exports={filterDemoOrders,lowStockItems};
