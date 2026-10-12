const {calculateShipping}=require('./shipping');
const messages={EMPTY_CART:'请选择商品',SKU_UNAVAILABLE:'商品已下架或规格不存在',INVALID_QUANTITY:'商品数量须为正整数',INSUFFICIENT_STOCK:'商品库存不足',PRICE_CHANGED:'商品价格已变化，请确认最新价格',INVALID_AMOUNT:'商品金额异常',INCOMPLETE_ADDRESS:'请先选择完整收货地区',INVALID_REGION:'收货地区信息不一致，请重新选择',INVALID_SHIPPING:'店铺运费尚未正确配置',INVALID_FULFILLMENT:'请选择配送或到店自提'};
function buildQuote({input,products,shop}) {
  const items=[],issues=[];let subtotalFen=0,hasPiano=false;
  const issue=(code,skuId)=>issues.push({skuId:skuId||'',code,message:messages[code]||'无法计算费用'});
  const lines=input&&Array.isArray(input.lines)?input.lines:[];
  if(!lines.length)issue('EMPTY_CART');
  const merged=new Map();
  for(const line of lines){
    if(!line||!Number.isSafeInteger(line.quantity)||line.quantity<=0){issue('INVALID_QUANTITY',line&&line.skuId);continue;}
    const old=merged.get(line.skuId);
    if(old){old.quantity+=line.quantity;if(old.expectedPriceFen!==line.expectedPriceFen)old.expectedPriceFen=null;}
    else merged.set(line.skuId,{...line});
  }
  for(const line of merged.values()){
    let found;
    for(const p of products||[]){const sku=(p.skus||[]).find(s=>s.id===line.skuId);if(sku&&p.status==='active'){found={p,sku};break;}}
    if(!found){issue('SKU_UNAVAILABLE',line.skuId);continue;}
    const {p,sku}=found;
    if(!Number.isSafeInteger(line.quantity)||line.quantity>sku.stock)issue('INSUFFICIENT_STOCK',line.skuId);
    if(line.expectedPriceFen!==sku.priceFen)issue('PRICE_CHANGED',line.skuId);
    const total=sku.priceFen*line.quantity;
    if(!Number.isSafeInteger(sku.priceFen)||sku.priceFen<0||!Number.isSafeInteger(total)||!Number.isSafeInteger(subtotalFen+total)){issue('INVALID_AMOUNT',line.skuId);continue;}
    subtotalFen+=total;hasPiano=hasPiano||p.shippingType==='piano';
    items.push({skuId:sku.id,title:p.title,label:sku.label,quantity:line.quantity,priceFen:sku.priceFen,lineTotalFen:total});
  }
  const rate=calculateShipping({fulfillment:input&&input.fulfillment,region:input&&input.region,hasPiano,shipping:shop&&shop.shipping});
  if(!rate.supported)issue(rate.code);
  const sum=rate.supported?subtotalFen+rate.shippingFen:null;
  if(sum!==null&&!Number.isSafeInteger(sum))issue('INVALID_AMOUNT');
  return {valid:issues.length===0,issues,items,subtotalFen,shippingFen:rate.shippingFen,totalFen:issues.length?null:sum};
}
module.exports={buildQuote};
