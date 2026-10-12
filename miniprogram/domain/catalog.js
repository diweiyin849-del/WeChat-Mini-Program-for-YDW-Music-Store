function getMinPriceFen(product) {
  const prices = (product.skus || []).map(s => s.priceFen).filter(Number.isSafeInteger);
  return prices.length ? Math.min.apply(null, prices) : 0;
}
function filterProducts(products, options) {
  const { categoryId, keyword, sort,minPriceFen,maxPriceFen,beginnerOnly,inStockOnly } = options || {};
  for(const value of [minPriceFen,maxPriceFen])if(value!==undefined&&(!Number.isSafeInteger(value)||value<0))throw new Error('价格筛选无效');
  if(minPriceFen!==undefined&&maxPriceFen!==undefined&&minPriceFen>maxPriceFen)throw new Error('最低价不能高于最高价');
  const word = String(keyword || '').trim().toLowerCase();
  const result = products.filter(p => p.status === 'active' && (!categoryId || p.categoryId === categoryId) &&
    (!word || [p.title, p.brand, p.model].join(' ').toLowerCase().includes(word))&&(!beginnerOnly||p.beginnerFriendly===true)&&
    (!(inStockOnly||minPriceFen!==undefined||maxPriceFen!==undefined)||(p.skus||[]).some(s=>(!inStockOnly||s.stock>0)&&(minPriceFen===undefined||s.priceFen>=minPriceFen)&&(maxPriceFen===undefined||s.priceFen<=maxPriceFen))));
  if (sort === 'price-asc' || sort === 'price-desc') result.sort((a,b) => (getMinPriceFen(a)-getMinPriceFen(b)) * (sort === 'price-asc' ? 1 : -1));
  return result;
}
function getCategorySummaries(categories, products) {
 const units={piano:'台','digital-piano':'台',guitar:'把',guzheng:'台',violin:'把',flute:'支',erhu:'把',drums:'套'};
 return categories.map(c=>{
  const list=products.filter(p=>p.status==='active'&&p.categoryId===c.id),cover=list.find(p=>p.images&&p.images.length);
  return {...c,modelCount:list.length,stockCount:list.reduce((sum,p)=>sum+(p.skus||[]).reduce((n,s)=>n+(Number.isSafeInteger(s.stock)&&s.stock>0?s.stock:0),0),0),image:cover?cover.images[0]:'',unit:units[c.id]||'件'};
 });
}
module.exports = { filterProducts, getMinPriceFen, getCategorySummaries };
