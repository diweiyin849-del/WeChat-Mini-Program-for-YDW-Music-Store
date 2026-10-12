const {validId}=require('../domain/admin');
function createSelectionService(storage){
 const read=key=>{const raw=storage.read(key,[]),ids=Array.from(new Set(raw.filter(validId))).slice(0,key==='comparison'?3:200);
  if(JSON.stringify(ids)!==JSON.stringify(raw))storage.recover(key,ids);return ids;};
 const check=id=>{if(!validId(id))throw new Error('商品编码无效');};
 return {
  favorites:()=>read('favorites'),comparison:()=>read('comparison'),
  toggleFavorite(id){check(id);const list=read('favorites'),has=list.includes(id);if(!has&&list.length>=200)throw new Error('最多收藏200款商品');storage.write('favorites',has?list.filter(x=>x!==id):list.concat(id));return !has;},
  addCompare(id){check(id);const list=read('comparison');if(list.includes(id))return;if(list.length>=3)throw new Error('最多对比3款，请先移除一款');storage.write('comparison',list.concat(id));},
  removeFavorite(id){storage.write('favorites',read('favorites').filter(x=>x!==id));},
  removeCompare(id){storage.write('comparison',read('comparison').filter(x=>x!==id));},
  clear(){storage.remove('favorites');storage.remove('comparison');}
 };
}
module.exports={createSelectionService};
