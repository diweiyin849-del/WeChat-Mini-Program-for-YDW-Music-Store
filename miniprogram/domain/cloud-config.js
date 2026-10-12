function validateCloudConfig(p){
 const issues=[];
 if(p.mode!=='cloud')issues.push('当前为演示模式，预约只保存在本机');
 if(!/^wx[0-9a-f]{16}$/i.test(p.appId||''))issues.push('请填写正式小程序 AppID');
 if(typeof p.cloudEnv!=='string'||!p.cloudEnv.trim())issues.push('请填写云开发环境 ID');
 if(!p.rules||p.rules.read!==false||p.rules.write!==false)issues.push('所有业务集合须禁止客户端直接读写');
 if(!p.templateId)issues.push('微信提醒尚未配置模板 ID（不影响独立云端预约）');
 const apis=p.cloudFunctionConfig&&p.cloudFunctionConfig.permissions&&p.cloudFunctionConfig.permissions.openapi;
 if(!Array.isArray(apis)||!apis.includes('subscribeMessage.send'))issues.push('store 云函数缺少订阅消息发送权限');
 return {ready:issues.length===0,issues,manualChecks:['在账号中创建业务集合并应用权限','部署 store 云函数并配置实际模板字段','初始化管理员并运行页面配置检查','用两个微信账号验证预约权限及真实通知']};
}
module.exports={validateCloudConfig};
