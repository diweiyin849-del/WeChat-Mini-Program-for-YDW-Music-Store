function invalid(message){const e=new Error(message);e.code='INVALID_APPOINTMENT';return e;}
const {validId}=require('./admin');
function storeClock(now){
 if(typeof Intl==='undefined'||!Intl.DateTimeFormat)throw invalid('当前环境不支持纽约时区，请升级微信后重试');
 const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});if(typeof formatter.formatToParts!=='function')throw invalid('当前环境不支持纽约时区，请升级微信后重试');const parts=formatter.formatToParts(now||new Date());
 const p={};for(const x of parts)p[x.type]=x.value;
 return {date:p.year+'-'+p.month+'-'+p.day,time:p.hour+':'+p.minute};
}
function appointmentDates(now){const today=storeClock(now).date,base=Date.parse(today+'T00:00:00Z');return Array.from({length:30},(_,i)=>new Date(base+(i+1)*86400000).toISOString().slice(0,10));}
function validateAppointment(input,{now,product}){
 const p=input||{};
 if(!validId(p.requestId)||!validId(p.productId)||!validId(p.skuId))throw invalid('预约编码无效');
 if(!product||product.id!==p.productId||product.status!=='active'||!(product.skus||[]).some(s=>s.id===p.skuId))throw invalid('商品已下架或规格不存在');
 if(!appointmentDates(now).includes(p.date))throw invalid('请选择纽约当地未来30天内的日期');
 if(!/^(0[8-9]|1[0-9]|2[0-1]):00$/.test(p.time))throw invalid('请选择8:00至21:00整点时间');
 const contact=String(p.contact||'').trim(),phone=String(p.phone||'').trim(),note=String(p.note||'').trim();
 if(!contact||contact.length>30)throw invalid('请填写30字以内的联系人');
 if(!/^\+?\d{7,15}$/.test(phone))throw invalid('请填写7至15位有效联系电话，可带+号');
 if(note.length>500)throw invalid('备注最多500字');
 return {requestId:p.requestId,productId:p.productId,skuId:p.skuId,date:p.date,time:p.time,contact,phone,note};
}
function nextStatus(current,next){const allowed={pending:['confirmed','cancelled'],confirmed:['completed','cancelled'],completed:[],cancelled:[]};if(!allowed[current]||!allowed[current].includes(next))throw invalid('预约状态已变化或不允许此操作');return next;}
function buildAppointment(input,{now,product,owner,id}){const p=validateAppointment(input,{now,product});return {...p,id,owner,productTitle:product.title,productModel:product.model||'',skuLabel:product.skus.find(s=>s.id===p.skuId).label,status:'pending',createdAt:(now||new Date()).toISOString()};}
module.exports={storeClock,appointmentDates,validateAppointment,nextStatus,buildAppointment};
