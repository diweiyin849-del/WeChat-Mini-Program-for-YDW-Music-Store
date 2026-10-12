# 真实预约和微信确认提醒：配置指引

当前交付默认演示模式。没有小程序账号也能体验预约页面及养护指南；演示预约只存本机，微信提醒未启用。本文件说明未来开通账号后的步骤，不表示已经部署。

## 现在直接体验

微信开发者工具导入包含 project.config.json 的目录，点击编译。商品页进入预约；「我的 → 我的试琴预约」查看。「演示商品管理 → 管理试琴预约」演示确认流程。「我的 → 乐器养护指南」和商品详情可查看八类指南。

演示预约列表中的提醒按钮禁用，并说明原因。商家管理中的「检查预约与提醒配置」在演示模式报告未连接真实云环境。

## 开通账号后启用真实预约

1. 注册微信小程序，取得 AppID，在微信开发者工具开通/选择云开发环境。项目目录选择本次新版或原项目，不要选历史解压目录。
2. project.config.json 中 appid 改为真实值。miniprogram/config.js 配置 `mode:'cloud'`、实际 `cloudEnv`；`appointmentTemplateId` 可以先为空，云端预约可独立运行。
3. 创建 categories、products、shop、admins、admin_audit、product_images、appointments、appointment_notifications 八个集合。每个集合使用根目录 database.rules.json，禁止客户端直接读写。暂不启用提醒也创建提醒集合，供配置检查使用。
4. 云存储按 storage.rules.json 配置，只存公开商品图片。运行 `node scripts/export-seed.js` 生成演示种子，导入分类、商品、店铺；文档 ID 与 id 一致，shop 文档 ID 为 main。正式使用前替换真实商品、联系方式和地址。演示预约不导入、不迁移。
5. 使用 Node 20 或以上运行 `node scripts/package-cloud.js`。cloudfunctions/store 下执行 `npm.cmd ci --ignore-scripts`，在开发工具上传部署 store 云函数，选择支持 Node 18 或以上的运行时并检查平台当前支持情况。服务端源码在根目录 server，不能只修改打包副本。
6. 通过可信云函数上下文/控制台取得琴行管理员自己的 OPENID，在 admins 集合创建以它为 ID 的文档，内容 `{"enabled":true}`。普通用户不能在小程序中添加管理员。
7. 在「我的 → 商家管理 → 检查预约与提醒配置」检查云连接和管理员。云连接检查预约及提醒集合能否访问，不代替全部部署验收。顾客预约到云端仍需管理员确认时间，没有自动锁定档期。

以上步骤无需支付账号、AppSecret 或支付密钥。

## 再启用微信确认提醒

本期是预约确认通知：顾客主动开启后，琴行确认预约时发送一次。没有到店前定时提醒、短信、取消通知或自动重试。

1. 在微信小程序后台选择适合实际业务的订阅模板，取得真实模板 ID 和字段。当前支持三个字段：乐器名称 thing、预约时间 time、门店名称 thing。平台没有适合模板时保持提醒关闭；不要编造 ID 或字段名。
2. store 云函数配置三个环境变量，客户端只填模板 ID。以下为**结构示例，不能直接发送**；字段名称替换成后台实际名称：

```text
APPOINTMENT_TEMPLATE_ID = 后台实际模板ID
APPOINTMENT_MESSAGE_STATE = developer
APPOINTMENT_TEMPLATE_FIELDS = {"thing1":{"source":"product","type":"thing"},"time2":{"source":"dateTime","type":"time"},"thing3":{"source":"store","type":"thing"}}
```

3. miniprogram/config.js 的 `appointmentTemplateId` 填相同实际模板 ID。不同模板不保存授权意愿。不要在客户端放 AppSecret 或发送密钥。
4. 消息版本 developer 对应开发版、trial 对应体验版、formal 对应正式版。根据当前验收版本明确选择，正式发布时同步更新。
5. cloudfunctions/store/config.json 已声明最小 `subscribeMessage.send` 权限，更改后重新上传部署。环境变量按平台要求使其生效。
6. 顾客保存待确认预约后，进入「我的试琴预约」点击「开启确认提醒」，在微信面板自愿允许。只在按钮点击时申请授权；拒绝、不支持、网络失败不影响预约。仅服务器保存后显示已登记提醒意愿。
7. 管理员确认先保存 confirmed，再尝试发送。thing 最多20个 Unicode 字符；time 为纽约当地预约时间。不含电话和备注。实际模板能否匹配及显示准确仍需真机验证。

运行 `npm.cmd run check:cloud` 检查本地配置；默认 demo 返回非零并显示未就绪属于预期。检查通过只代表本地必要项齐全，服务器环境变量、账号权限、模板、部署和真实通知仍需人工检查。云端预约可独立运行，「预约+提醒」整体配置检查会列出缺失提醒项。

## 提醒状态

| 页面状态 | 含义 |
| --- | --- |
| 微信提醒未启用 | 演示模式或服务器模板未配置，预约仍可使用 |
| 已登记提醒意愿 | 顾客报告接受，服务端已保存；最终投递由微信判定 |
| 微信接口已接受 | 接口返回成功，不代表顾客已阅读 |
| 发送失败 | 明确配置、内容或微信错误；预约确认保持有效 |
| 发送结果未确认 | 超时、中断或保存结果失败；不自动重发 |
| 暂时无法读取提醒状态 | 查询失败，可重新进入列表，不冒充成功 |
| 模板已更新 | 待确认预约需顾客重新开启新模板；已确认预约不补发 |

每次确认最多领取一次任务；中断留下的 sending 记录不重新领取。appointment_notifications 禁止客户端直接访问。顾客可联系琴行核对，当前没有重发按钮。

## 两个账号验收

- 顾客提交预约，管理员能查看；其他顾客不能查看别人记录、确认预约或检查商家配置。
- 拒绝提醒仍能查询/取消。接受后可登记；已确认或取消不能补开提醒。
- 允许提醒后管理员确认，状态为已确认，通知跳转本小程序预约列表，显示纽约预约时间。
- 并发确认不重复发送；无意愿旧记录可正常管理，不发送。
- 缺模板、权限或断网显示错误，通知失败不回滚确认；离开页面不弹旧请求结果。
- 完成微信开发工具编译和真机布局检查。当前未在你的账号部署，未验证真实消息投递。

## 技术资料

云调用契约参考 [CloudBase 官方指引](https://docs.cloudbase.net/en/recipes/add-subscribe-message-cloud-function)；权限参考 [官方权限错误说明](https://docs.cloudbase.net/en/faq/knowledge/cloud-call-604101-permission-error)。模板字段以后台实际模板及 [微信消息文档](https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-message-management/subscribe-message/sendMessage.html) 为准。实施时微信文档网页未能直接打开，云调用采用可访问的 CloudBase 官方资料；实际模板及客户端 API 须真机核验。
