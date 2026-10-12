const {isValidRegion}=require('./region');
function validateAddress(a) {
  const issues=[];
  if(!a || typeof a!=='object') return {valid:false,issues:['地址格式不正确']};
  if(typeof a.contact!=='string'||!a.contact.trim())issues.push('请输入联系人');
  if(typeof a.phone!=='string'||!/^1[3-9]\d{9}$/.test(a.phone))issues.push('请输入正确的手机号码');
  if(!isValidRegion(a))issues.push('请选择一致的省、市、区县');
  if(typeof a.detail!=='string'||!a.detail.trim())issues.push('请输入详细地址');
  if(a.regionNames!==undefined&&(!Array.isArray(a.regionNames)||a.regionNames.some(n=>typeof n!=='string')))issues.push('地区名称格式不正确');
  return {valid:issues.length===0,issues};
}
module.exports={validateAddress};
