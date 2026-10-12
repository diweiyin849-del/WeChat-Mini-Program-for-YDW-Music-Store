const titles=['日常清洁','存放环境','使用后处理','联系琴行'];
const sources={
 piano:{title:'Yamaha · 钢琴家庭养护',url:'https://www.yamaha.com/en/musical_instrument_guide/piano/maintenance/'},
 digital:{title:'Yamaha · 电钢琴养护',url:'https://hub.europe.yamaha.com/articles/care-and-maintenance-of-a-digital-piano-and-keyboard'},
 guitar:{title:'Taylor · 吉他清洁',url:'https://www.taylorguitars.com/support/maintenance/properly-cleaning-your-guitar'},
 violin:{title:'Yamaha · 小提琴日常养护',url:'https://www.yamaha.com/en/musical_instrument_guide/violin/maintenance/'},
 folk:{title:'香港康文署音乐事务处 · 乐器选购及保养',url:'https://www.lcsd.gov.hk/sc/mo/faq/instrumentbuyingandmaintenance.html'},
 drums:{title:'Roland · 电子鼓垫清洁',url:'https://support.roland.com/hc/en-us/articles/201955489-V-Drums-Cleaning-the-V-Drum-or-Cymbal-Pads'}
};
const rows=[
 ['piano','钢琴',sources.piano,[
  ['用洁净柔软布轻拭琴键和外壳。','清洁液的选择按琴键及漆面说明书，避免液体进入琴内。'],
  ['避开直射阳光、暖气及空调直吹。','不要在琴上放置花瓶、饮料等容易倾倒的物品。'],
  ['收好乐谱和物品，按琴型合好琴盖。','留意音准变化，由专业人员评估调律安排。'],
  ['琴键卡住、杂音或音准异常时预约检查。','调律、搬运和内部清洁请先咨询；费用以实际确认为准。']]],
 ['digital-piano','电钢琴',sources.digital,[
  ['关机并断开电源后，用柔软布清洁表面。','不要向琴键和接口直接喷清洁液。'],
  ['保持放置稳固，远离水源与高温。','按具体型号说明书保留散热空间。'],
  ['正常关机，整理电源及踏板线，避免拉扯。','闲置时使用合适防尘罩。'],
  ['按键无声、接口松动或电源异常时联系琴行。','发现进液或异味应停用断电，不自行拆修。']]],
 ['guitar','吉他',sources.guitar,[
  ['用柔软布轻擦琴身及演奏留下的汗渍。','亮光、哑光和未上漆木材的清洁方式不同，先确认型号要求。'],
  ['避免暴晒及温湿度突然变化。','不使用时放在合适琴盒或稳固琴架上。'],
  ['清理弦与琴颈上的汗渍，收好配件。','电箱型号按说明书处理电池与连接线。'],
  ['琴颈变形、打品或开裂时预约专业检查。','不确定如何换弦或调整弦距时请先咨询。']]],
 ['guzheng','古筝',sources.folk,[
  ['保持琴面清洁，轻拭表面灰尘。','清洁用品按具体漆面说明书选择，不擅自涂油。'],
  ['稳固摆放，避免碰撞和重物压在琴面。','存放温湿度以具体型号说明书为准。'],
  ['不用时收回琴盒或用合适软罩覆盖。','收好义甲与调音工具。'],
  ['出现裂纹、杂音或琴码不稳时联系琴行。','换弦、排码和调音不熟练时请教师或专业人员指导。']]],
 ['violin','小提琴',sources.violin,[
  ['演奏后用柔软干布清除松香和汗渍。','琴弦与琴身可分布擦拭，顽固污渍交给专业人员。'],
  ['避免阳光直射、空调直吹和温湿度突变。','放在合适琴盒中，防止碰撞。'],
  ['放松弓毛，擦净后放回琴盒。','避免用手触摸弓毛。'],
  ['开胶、裂纹、琴桥倾斜或音柱问题请预约检查。','不要自行使用胶水或酒精修复漆面。']]],
 ['flute','笛子',sources.folk,[
  ['吹奏后用干净软布轻擦吹孔周围。','深度清洁按竹材、内壁工艺和说明书要求进行。'],
  ['防止磕碰、跌落及阳光直射。','不要靠近暖气或热风烘干。'],
  ['处理好表面水分，妥善收入笛袋或笛套。','留意笛膜和竹身状况。'],
  ['裂纹、活节松动或笛膜问题可联系琴行。','不确定清洁方式时，先咨询再操作。']]],
 ['erhu','二胡',sources.folk,[
  ['演奏后清理表面汗渍及松香粉。','琴皮及漆面的处理遵循型号说明，不随意涂清洁剂。'],
  ['防止琴轴和琴筒受到碰撞。','注意潮湿环境，防潮方式按琴盒及乐器说明选择。'],
  ['清洁后放入琴盒或琴袋，整理琴弓及配件。','检查弦线和琴皮是否出现明显异常。'],
  ['琴皮下陷、开裂、琴轴持续松脱时联系琴行。','换弦或琴码调整不熟练时，请先寻求指导。']]],
 ['drums','电子鼓',sources.drums,[
  ['关机断电后清洁，模块与接口避免进液。','鼓垫清洁按型号说明进行；清洁后充分干燥。'],
  ['放在稳固位置，远离水源和高温。','给连接线留出余量，避免踩踏和过度弯折。'],
  ['正常关机，收好鼓棒，检查支架是否稳固。','不使用时做好防尘。'],
  ['触发不灵、异常杂音或鼓垫破损时联系琴行。','内部电路维修交由专业人员处理。']]]
];
const guides=rows.map(([categoryId,title,source,items])=>({categoryId,title,sections:items.map((items,i)=>({title:titles[i],items})),sources:[source]}));
function getCareGuide(categoryId){return guides.find(g=>g.categoryId===categoryId)||null;}
module.exports={guides,getCareGuide};
