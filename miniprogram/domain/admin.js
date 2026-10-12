const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(v);
function validateProduct(p) {
 const issues=[];
 if(!p||typeof p!=='object')return {valid:false,issues:['商品格式不正确']};
 if(!validId(p.id)||!validId(p.categoryId))issues.push('商品或分类编码无效');
 if(typeof p.title!=='string'||!p.title.trim()||p.title.length>120)issues.push('请填写120字以内的商品名称');
 if(!['active','inactive'].includes(p.status))issues.push('请选择上架状态');
 if(!['normal','piano'].includes(p.shippingType)||(p.categoryId==='piano'&&p.shippingType!=='piano')||(p.categoryId!=='piano'&&p.shippingType!=='normal'))issues.push('钢琴与其他分类的配送类型不一致');
 if(!Array.isArray(p.skus)||p.skus.length===0||p.skus.length>30)issues.push('请配置1至30个规格');
 const ids=new Set();
 for(const s of p.skus||[]){
  if(!s||!validId(s.id)||ids.has(s.id)||s.productId!==p.id||typeof s.label!=='string'||!s.label.trim())issues.push('规格编码、名称或所属商品不正确');
  if(s){ids.add(s.id);if(!Number.isSafeInteger(s.priceFen)||s.priceFen<=0)issues.push('价格须为正整数分');if(!Number.isSafeInteger(s.stock)||s.stock<0)issues.push('库存须为非负整数');}
 }
 if(!Array.isArray(p.images)||p.images.length>9||p.images.some(x=>typeof x!=='string'))issues.push('最多添加9张商品图片');
 if(p.specs!==undefined&&(!p.specs||typeof p.specs!=='object'||Array.isArray(p.specs)||['dimensions','material','audience','accessories'].some(k=>p.specs[k]!==undefined&&(typeof p.specs[k]!=='string'||p.specs[k].length>500))))issues.push('商品参数须为500字以内的文字');
 if(p.beginnerFriendly!==undefined&&typeof p.beginnerFriendly!=='boolean')issues.push('初学者标记无效');
 return {valid:issues.length===0,issues};
}
function validateShop(s) {
 const issues=[];
 if(!s||typeof s!=='object')return {valid:false,issues:['店铺资料格式不正确']};
 if(!['YDW琴行','和齐升琴行'].includes(s.name)||s.provinceCode!=='650000'||s.cityCode!=='650500')issues.push('店名和所在地必须为YDW琴行、美国纽约市');
 if(!s.shipping||![s.shipping.localFen,s.shipping.regionalFen,s.shipping.pianoFen].every(n=>Number.isSafeInteger(n)&&n>=0))issues.push('运费须为非负整数分');
 for(const k of ['internationalFen','internationalPianoFen'])if(s.shipping&&s.shipping[k]!==undefined&&(!Number.isSafeInteger(s.shipping[k])||s.shipping[k]<0))issues.push('境外运费须为非负整数分');
 if(s.lowStockThreshold!==undefined&&(!Number.isSafeInteger(s.lowStockThreshold)||s.lowStockThreshold<0||s.lowStockThreshold>9999))issues.push('库存预警阈值须为0至9999整数');
 for(const k of ['address','phone','hours'])if(typeof s[k]!=='string')issues.push('请检查门店地址、电话和营业时间');
 return {valid:issues.length===0,issues};
}
module.exports={validateProduct,validateShop,validId};
