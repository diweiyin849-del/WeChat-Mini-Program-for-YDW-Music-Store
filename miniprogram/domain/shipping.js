const {isValidRegion}=require('./region');
const {normalizeShop}=require('./shop-config');
function calculateShipping({fulfillment,region,hasPiano,shipping}) {
  const fail=code=>({supported:false,shippingFen:null,code});
  if(fulfillment==='pickup') return {supported:true,shippingFen:0,code:null};
  if(fulfillment!=='delivery')return fail('INVALID_FULFILLMENT');
  if(!region||![region.provinceCode,region.cityCode,region.districtCode].every(c=>typeof c==='string'&&/^\d{6}$/.test(c)))return fail('INCOMPLETE_ADDRESS');
  if(!isValidRegion(region))return fail('INVALID_REGION');
  if(!shipping)return fail('INVALID_SHIPPING');
  const rates=normalizeShop({shipping}).shipping;
  if(!['localFen','regionalFen','pianoFen','internationalFen','internationalPianoFen'].every(k=>Number.isSafeInteger(rates[k])&&rates[k]>=0))return fail('INVALID_SHIPPING');
  const overseas=region.provinceCode!=='650000';
  return {supported:true,shippingFen:overseas?(hasPiano?rates.internationalPianoFen:rates.internationalFen):(hasPiano?rates.pianoFen:(region.cityCode==='650500'?rates.localFen:rates.regionalFen)),code:null};
}
module.exports={calculateShipping};
