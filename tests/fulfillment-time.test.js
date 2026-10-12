const test=require('node:test'),assert=require('node:assert/strict');
const {fulfillmentOptions,validateFulfillmentTime,assertFulfillmentTime}=require('../miniprogram/domain/fulfillment-time');
const now=new Date('2026-10-12T16:30:00Z'),slot=(date,time='10:00')=>({date,time,timeZone:'America/New_York'});
test('NY dates include today through day29 with genuine calendar and future slots',()=>{
 const r=fulfillmentOptions(now);assert.equal(r.clock.date,'2026-10-12');assert.equal(r.clock.time,'12:30');assert.equal(r.dates.length,30);assert.equal(r.dates.at(-1),'2026-11-10');assert.equal(r.times[0],'08:00');assert.equal(r.times.at(-1),'21:00');
 assert.equal(validateFulfillmentTime(slot('2026-10-12','13:00'),now).time,'13:00');assert.equal(validateFulfillmentTime(slot('2026-11-10'),now).date,'2026-11-10');
 for(const bad of [slot('2026-10-12','12:00'),slot('2026-11-11'),slot('2026-02-30'),slot('2026-10-13','22:00'),{...slot('2026-10-13'),timeZone:'UTC'}])assert.throws(()=>validateFulfillmentTime(bad,now));
 assert.doesNotThrow(()=>assertFulfillmentTime(slot('2020-10-12')));
});
test('NY midnight and DST clocks do not fall back to device time',()=>{
 assert.equal(fulfillmentOptions(new Date('2026-10-12T03:30:00Z')).clock.date,'2026-10-11');
 assert.equal(fulfillmentOptions(new Date('2026-11-01T05:30:00Z')).clock.time,'01:30');assert.equal(fulfillmentOptions(new Date('2026-11-01T06:30:00Z')).clock.time,'01:30');
 const saved=global.Intl;try{global.Intl=undefined;assert.throws(()=>fulfillmentOptions(now),/纽约时区/);}finally{global.Intl=saved;}
});
