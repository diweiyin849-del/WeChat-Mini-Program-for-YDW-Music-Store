const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
// Evaluate ancestor wx:if gates to exercise whether a static native action is reachable.
function visibleActions(file,data){const stack=[],actions=[];for(const m of fs.readFileSync(file,'utf8').matchAll(/<\s*(\/?)\s*([\w-]+)([^>]*?)>/g)){
 if(m[1]){stack.pop();continue;}const attrs=m[3],condition=/wx:if="\{\{([\s\S]*?)\}\}"/.exec(attrs);let visible=stack.every(Boolean);
 if(condition)visible=visible&&!!vm.runInNewContext(condition[1],data);
 const action=/bindtap="([^"]+)"/.exec(attrs);if(visible&&action)actions.push(action[1]);if(!attrs.trim().endsWith('/'))stack.push(visible);
 }return actions;}
test('admin setup action remains visible after successful authorization without an error',()=>{
 const actions=visibleActions('miniprogram/pages/admin/index.wxml',{allowed:true,demo:true,loading:false,error:'',appointmentSetup:null,tab:'products',form:null,products:[],categoryForm:null,shopForm:null});
 assert.ok(actions.includes('checkAppointmentSetup'));
});
test('normal demo checkout and merchant management expose simulation actions',()=>{
 assert.ok(visibleActions('miniprogram/pages/checkout/index.wxml',{demo:true,fulfillment:'pickup',address:null,shop:{},error:'',loading:false,quoteLoading:false,quote:{items:[],valid:true,issues:[]},priceChanged:false}).includes('submitDemoOrder'));
 assert.ok(visibleActions('miniprogram/pages/admin/index.wxml',{allowed:true,demo:true,loading:false,error:'',appointmentSetup:null,tab:'products',form:null,products:[],categoryForm:null,shopForm:null}).includes('orders'));
 assert.ok(visibleActions('miniprogram/pages/profile/index.wxml',{demo:true,admin:true,error:'',showPrivacy:false,shop:{}}).includes('orders'));
 const payment=visibleActions('miniprogram/pages/demo-payment/index.wxml',{loading:false,error:'',order:{status:'pending'}});assert.equal(payment.filter(x=>x==='pay').length,3);
});
test('merchant time confirmation is visible only on eligible paid orders',()=>{
 const data={admin:true,order:{status:'paid',desiredTime:{date:'2026-10-13',time:'10:00'},items:[],address:null},error:'',loading:false,timeError:''};
 assert.ok(visibleActions('miniprogram/pages/demo-order/index.wxml',data).includes('confirmTime'));
 assert.ok(!visibleActions('miniprogram/pages/demo-order/index.wxml',{...data,admin:false}).includes('confirmTime'));
 assert.ok(!visibleActions('miniprogram/pages/demo-order/index.wxml',{...data,order:{...data.order,status:'completed'}}).includes('confirmTime'));
});
