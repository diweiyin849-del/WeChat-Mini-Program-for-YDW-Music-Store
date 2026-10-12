function buildCartView(lines,products){
 let subtotalFen=0;const issues=[];
 const items=lines.map(line=>{
  let found;for(const p of products){const sku=(p.skus||[]).find(s=>s.id===line.skuId);if(sku){found={p,sku};break;}}
  let problem='';let code='';
  if(!found||found.p.status!=='active'){problem='商品已下架或规格不存在';code='SKU_UNAVAILABLE';}
  else if(!Number.isSafeInteger(line.quantity)||line.quantity<=0){problem='商品数量不正确';code='INVALID_QUANTITY';}
  else if(line.quantity>found.sku.stock){problem='库存不足，请调整数量';code='INSUFFICIENT_STOCK';}
  if(line.selected&&problem)issues.push({skuId:line.skuId,code,message:problem});
  if(line.selected&&!problem)subtotalFen+=found.sku.priceFen*line.quantity;
  return {...line,title:found?found.p.title:'失效商品',label:found?found.sku.label:'规格已失效',priceFen:found?found.sku.priceFen:0,
   stock:found?found.sku.stock:0,productId:found?found.p.id:'',categoryId:found?found.p.categoryId:'',image:found&&found.p.images[0]||'',problem};
 });
 return {items,subtotalFen,canPreview:lines.some(l=>l.selected)&&issues.length===0,issues};
}
module.exports={buildCartView};
