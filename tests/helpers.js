function memoryPlatform() {
  const data = new Map();
  return {data,getStorageSync:key=>data.get(key),setStorageSync:(key,v)=>data.set(key,v),removeStorageSync:key=>data.delete(key)};
}
function memoryRepository(seed) {
 const data=JSON.parse(JSON.stringify(seed)),audit=[];
 return {data,audit,listCategories:async()=>data.categories,listProducts:async()=>data.products,
 getProduct:async id=>data.products.find(p=>p.id===id)||null,getShop:async()=>data.shop,isAdmin:async id=>id==='admin',
 saveProduct:async(p,actor)=>{const i=data.products.findIndex(x=>x.id===p.id);if(i>=0)data.products[i]=p;else data.products.push(p);audit.push({actor,action:'product',id:p.id});return p;},
 saveCategory:async(c,actor)=>{const i=data.categories.findIndex(x=>x.id===c.id);if(i>=0)data.categories[i]=c;else data.categories.push(c);audit.push({actor,action:'category'});return c;},
 saveShop:async(s,actor)=>{data.shop=s;audit.push({actor,action:'shop'});return s;},
 ownsImage:async id=>id==='cloud://owned',storeImage:async()=>({fileId:'cloud://owned'})};
}
module.exports={memoryPlatform,memoryRepository};
