function normalizeCart(lines) {
  if(!Array.isArray(lines)) return [];
  const seen=new Set();
  return lines.filter(l=>l && typeof l.skuId==='string' && l.skuId.length>0 && Number.isSafeInteger(l.quantity) && l.quantity>0 && !seen.has(l.skuId) && seen.add(l.skuId))
    .map(l=>({skuId:l.skuId,quantity:l.quantity,selected:l.selected!==false,...(typeof l.generation==='string'&&l.generation?{generation:l.generation}:{}),...(Number.isSafeInteger(l.expectedPriceFen)&&l.expectedPriceFen>0?{expectedPriceFen:l.expectedPriceFen}:{})}));
}
module.exports={normalizeCart};
