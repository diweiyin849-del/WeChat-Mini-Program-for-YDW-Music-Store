const {normalizeCart}=require('../domain/cart');
function createCartService(storage) {
  const getLines=()=>{const raw=storage.read('cart',[]),lines=normalizeCart(raw);if(JSON.stringify(raw)!==JSON.stringify(lines))storage.recover('cart',lines);return lines;};
  return {getLines,
    consumePurchased(purchased){const lines=getLines();storage.write('cart',lines.map(l=>{const bought=purchased.find(i=>i.skuId===l.skuId&&i.cartGeneration===(l.generation||'legacy-'+l.skuId));return {...l,quantity:l.quantity-(bought?bought.quantity:0)};}).filter(l=>l.quantity>0));},
    setQuantity(skuId,quantity,expectedPriceFen) {
      if(typeof skuId!=='string'||!skuId.trim()||!Number.isSafeInteger(quantity)||quantity<=0) throw new Error('商品数量须为正整数');
      const lines=getLines(),existing=lines.find(l=>l.skuId===skuId);
      if(expectedPriceFen!==undefined&&(!Number.isSafeInteger(expectedPriceFen)||expectedPriceFen<=0))throw new Error('商品价格不正确');
      if(existing){existing.quantity=quantity;if(expectedPriceFen!==undefined)existing.expectedPriceFen=expectedPriceFen;}
      else lines.push({skuId,quantity,selected:true,generation:'g'+Date.now()+'-'+Math.random().toString(36).slice(2,12),...(expectedPriceFen!==undefined?{expectedPriceFen}:{})});
      storage.write('cart',lines);
    },
    setSelected(skuId,selected) {const lines=getLines();const line=lines.find(l=>l.skuId===skuId);if(line)line.selected=!!selected;storage.write('cart',lines);},
    remove(skuId) {storage.write('cart',getLines().filter(l=>l.skuId!==skuId));},
    clear() {storage.remove('cart');}
  };
}
module.exports={createCartService};
