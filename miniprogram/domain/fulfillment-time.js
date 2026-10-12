const {storeClock}=require('./appointments');
function fulfillmentOptions(now){
 if(!(now instanceof Date)||!Number.isFinite(now.getTime()))throw Error('无法读取门店当前时间');
 const clock=storeClock(now),base=Date.parse(clock.date+'T00:00:00Z');
 return {clock,dates:Array.from({length:30},(_,i)=>new Date(base+i*86400000).toISOString().slice(0,10)),times:Array.from({length:14},(_,i)=>String(i+8).padStart(2,'0')+':00')};
}
function assertFulfillmentTime(value){
 if(!value||typeof value.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||!Number.isFinite(Date.parse(value.date+'T00:00:00Z'))||new Date(value.date+'T00:00:00Z').toISOString().slice(0,10)!==value.date||typeof value.time!=='string'||!/^(0[89]|1\d|2[01]):00$/.test(value.time)||value.timeZone!=='America/New_York')throw Error('交付时间无效，请选择纽约门店日期和整点时间');
 return {date:value.date,time:value.time,timeZone:'America/New_York'};
}
function validateFulfillmentTime(value,now){const v=assertFulfillmentTime(value),options=fulfillmentOptions(now);if(!options.dates.includes(v.date)||v.date+' '+v.time<=options.clock.date+' '+options.clock.time)throw Error('请选择纽约当地今天起30天内、晚于当前时间的交付时间');return v;}
module.exports={fulfillmentOptions,validateFulfillmentTime,assertFulfillmentTime};
