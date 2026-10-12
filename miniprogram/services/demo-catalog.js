const seed = require('../data/demo-catalog');
const {filterProducts} = require('../domain/catalog');
const {buildQuote} = require('../domain/quote');
const {validateProduct,validateShop,validId}=require('../domain/admin');
const {createDemoCommerce}=require('./demo-commerce');
const {normalizeShop,productBrandView}=require('../domain/shop-config');
// 同步替换旧版本机演示资料中的地区文案。
const clone = x => JSON.parse(JSON.stringify(x)
  .replace(/\u65b0\u7586\u7ef4\u543e\u5c14\u81ea\u6cbb\u533a/g,'美国')
  .replace(/\u65b0\u7586\u533a\u5185/g,'美国境内')
  .replace(/\u65b0\u7586/g,'美国').replace(/\u54c8\u5bc6/g,'纽约'));
function createDemoCatalog(storage,platform) {
  const read=(key,fallback)=>clone(storage?storage.read('demo-'+key,fallback):fallback);
  const write=(key,data)=>{if(!storage)throw new Error('演示管理需要本机存储');storage.write('demo-'+key,clone(data));};
  const legacyCatalog=()=>{
    const all=read('products',seed.products);
    if(!storage)return all;
    if(storage.read('demo-catalog-revision',0)>=3)return all;
    for(const p of clone(seed.products)){
      const existing=all.find(x=>x.id===p.id);
      if(!existing)all.push(p);
      else {if(!existing.images||!existing.images.length)existing.images=p.images;
        existing.specs={...p.specs,...(existing.specs||{})};if(existing.beginnerFriendly===undefined)existing.beginnerFriendly=p.beginnerFriendly;}
    }
    write('products',all);storage.write('demo-catalog-revision',3);return all;
  },shop=()=>{
    const s=read('shop',seed.shop);
    if(storage&&storage.read('demo-shop-revision',0)<2){
      for(const key of ['address','phone','hours'])if(!s[key])s[key]=seed.shop[key];
      write('shop',s);storage.write('demo-shop-revision',2);
    }
    return normalizeShop(s);
  },categories=()=>read('categories',seed.categories);
  const demoCommerce=storage?createDemoCommerce(storage,legacyCatalog):null;
  const catalog=()=>(demoCommerce?demoCommerce.snapshot().products:legacyCatalog()).map(productBrandView);
  return {demoCommerce,demoShop:shop,listCategories:async()=>categories().sort((a,b)=>a.sort-b.sort),listProducts:async options=>filterProducts(catalog(),options),
    getProduct:async id=>catalog().find(p=>p.id===id&&p.status==='active')||null,getShop:async()=>shop(),
    quote:async input=>buildQuote({input,products:catalog(),shop:shop()}),getAdminAccess:async()=>({allowed:true,demo:true}),adminListProducts:async()=>catalog(),
    adminSaveProduct:async p=>{const check=validateProduct(p);if(!check.valid)throw new Error(check.issues[0]);if(!demoCommerce)throw new Error('演示管理需要本机存储');return demoCommerce.mutate(d=>{const i=d.products.findIndex(x=>x.id===p.id),old=d.products[i];if(old&&(p.demoRevision||0)!==(old.demoRevision||0))throw Error('商品或库存已变化，请关闭编辑并刷新后重试');const next={...clone(p),demoRevision:(old&&old.demoRevision||0)+1};if(i>=0)d.products[i]=next;else d.products.push(next);return next;});},
    adminSaveCategory:async c=>{if(!validId(c.id)||!c.name.trim()||!Number.isSafeInteger(c.sort))throw new Error('分类资料无效');const all=categories();const i=all.findIndex(x=>x.id===c.id);if(i>=0)all[i]=clone(c);else all.push(clone(c));write('categories',all);return c;},
    adminSaveShop:async s=>{const check=validateShop(s);if(!check.valid)throw new Error(check.issues[0]);const next=normalizeShop(s);write('shop',next);return next;},
    adminUploadImage:localPath=>new Promise((resolve,reject)=>{if(!platform) return reject(new Error('图片上传仅能在小程序中使用'));platform.saveFile({tempFilePath:localPath,success:r=>resolve({fileId:r.savedFilePath}),fail:reject});})};
}
module.exports = {createDemoCatalog};
