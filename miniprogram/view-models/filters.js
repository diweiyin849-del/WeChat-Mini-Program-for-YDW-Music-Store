const {parseYuan}=require('./admin');
function parseFilters(input){const p=input||{},minPriceFen=String(p.minYuan||'').trim()?parseYuan(p.minYuan):undefined,maxPriceFen=String(p.maxYuan||'').trim()?parseYuan(p.maxYuan):undefined;
 if(minPriceFen!==undefined&&maxPriceFen!==undefined&&minPriceFen>maxPriceFen)throw new Error('最低价不能高于最高价');
 return {minPriceFen,maxPriceFen,inStockOnly:!!p.inStockOnly,beginnerOnly:!!p.beginnerOnly};}
module.exports={parseFilters};
