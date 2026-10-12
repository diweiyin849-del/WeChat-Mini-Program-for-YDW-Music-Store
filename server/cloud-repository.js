const crypto=require('node:crypto');
const {nextStatus}=require('../miniprogram/domain/appointments');
const {validId}=require('../miniprogram/domain/admin');
function createCloudRepository(cloud){
 const db=cloud.database();
 async function list(name){let all=[],skip=0;while(true){const r=await db.collection(name).skip(skip).limit(100).get();all=all.concat(r.data);if(r.data.length<100)return all;skip+=100;}}
 async function byId(name,id){if(typeof id!=='string'||!id)return null;const r=await db.collection(name).where({_id:id}).limit(1).get();return r.data[0]||null;}
 async function save(name,id,data,actor){await db.runTransaction(async tx=>{await tx.collection(name).doc(id).set({data});await tx.collection('admin_audit').add({data:{actor,action:name,targetId:id,time:new Date()}});});return data;}
 async function appointmentInTransaction(tx,id){
  try{const r=await tx.collection('appointments').doc(id).get();return Array.isArray(r.data)?r.data[0]||null:r.data||null;}
  catch(e){if(/document.*(not exist|not found)/i.test(e.message||e.errMsg||''))return null;throw e;}
 }
 return {listCategories:()=>list('categories'),listProducts:()=>list('products'),getProduct:id=>byId('products',id),getShop:()=>byId('shop','main'),
  getAppointment:id=>validId(id)?byId('appointments',id):null,
  async listAppointments(owner){let all=[],skip=0;while(true){let query=db.collection('appointments');if(owner)query=query.where({owner});const r=await query.skip(skip).limit(100).get();all=all.concat(r.data);if(r.data.length<100)break;skip+=100;}return all.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));},
  async createAppointmentOnce(record){return db.runTransaction(async tx=>{const old=await appointmentInTransaction(tx,record.id);if(old)return old;await tx.collection('appointments').doc(record.id).set({data:record});return record;});},
  async transitionAppointment({id,actor,admin,status}){if(!validId(id))throw new Error('预约编码无效');return db.runTransaction(async tx=>{const a=await appointmentInTransaction(tx,id);if(!a||(!admin&&a.owner!==actor))throw new Error('预约不存在或无权操作');const {_id,...savedFields}=a;const updated={...savedFields,status:nextStatus(a.status,status)};await tx.collection('appointments').doc(id).set({data:updated});if(admin)await tx.collection('admin_audit').add({data:{actor,action:'appointment-status',targetId:id,status,time:new Date()}});return updated;});},
  isAdmin:async openid=>{const a=await byId('admins',openid);return !!a&&a.enabled===true;},
  saveProduct:(p,actor)=>save('products',p.id,p,actor),saveCategory:(c,actor)=>save('categories',c.id,c,actor),saveShop:(s,actor)=>save('shop','main',s,actor),
  ownsImage:async fileId=>{const r=await db.collection('product_images').where({fileId}).limit(1).get();return r.data.length===1;},
  async storeImage({base64,mime},actor){
   const buffer=Buffer.from(base64,'base64'),path='products/'+crypto.randomUUID()+(mime==='image/png'?'.png':'.jpg');
   const result=await cloud.uploadFile({cloudPath:path,fileContent:buffer});
   try{await db.collection('product_images').add({data:{fileId:result.fileID,actor,mime,size:buffer.length,time:new Date()}});}
   catch(e){await cloud.deleteFile({fileList:[result.fileID]}).catch(()=>{});throw e;}
   return {fileId:result.fileID};
  }
 };
}
module.exports={createCloudRepository};
