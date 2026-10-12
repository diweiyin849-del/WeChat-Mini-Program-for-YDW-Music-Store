function createCloudCatalog(platform){
 async function call(action,payload){
  const res=await platform.cloud.callFunction({name:'store',data:{action,payload:payload||{}}});
  const result=res.result;if(!result||!result.ok){const e=new Error(result&&result.error&&result.error.message||'服务暂不可用，请重试');e.code=result&&result.error&&result.error.code;throw e;}return result.data;
 }
 return {listCategories:()=>call('listCategories'),listProducts:o=>call('listProducts',o),getProduct:id=>call('getProduct',{id}),getShop:()=>call('getShop'),
 quote:input=>call('quote',{lines:(input.lines||[]).map(l=>({skuId:l.skuId,quantity:l.quantity,expectedPriceFen:l.expectedPriceFen})),fulfillment:input.fulfillment,
   region:input.region?{provinceCode:input.region.provinceCode,cityCode:input.region.cityCode,districtCode:input.region.districtCode}:null}),
 getAdminAccess:()=>call('getAdminAccess'),adminListProducts:()=>call('adminListProducts'),adminSaveProduct:p=>call('adminSaveProduct',p),
 adminSaveCategory:c=>call('adminSaveCategory',c),adminSaveShop:s=>call('adminSaveShop',s),
 adminUploadImage:localPath=>new Promise((resolve,reject)=>{platform.getFileSystemManager().readFile({filePath:localPath,encoding:'base64',success:r=>{
   const mime=r.data.startsWith('iVBORw0KGgo')?'image/png':'image/jpeg';call('adminUploadImage',{base64:r.data,mime}).then(resolve,reject);
 },fail:reject});})};
}
module.exports={createCloudCatalog};
