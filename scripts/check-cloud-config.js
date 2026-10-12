const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const client=require('../miniprogram/config'),{validateCloudConfig}=require('../miniprogram/domain/cloud-config');
const r=validateCloudConfig({appId:read('project.config.json').appid,...client,templateId:client.appointmentTemplateId,rules:read('database.rules.json'),cloudFunctionConfig:read('cloudfunctions/store/config.json')});
console.log(r.ready?'本地配置检查通过；仍须完成账号部署及真机验收':'尚未就绪：\n'+r.issues.map(s=>'• '+s).join('\n'));
console.log('账号内人工检查：\n'+r.manualChecks.map(s=>'• '+s).join('\n'));process.exitCode=r.ready?0:1;
