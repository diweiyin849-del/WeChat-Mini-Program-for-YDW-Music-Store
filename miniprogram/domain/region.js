function isValidRegion(region){
 if(!region||![region.provinceCode,region.cityCode,region.districtCode].every(c=>typeof c==='string'&&/^\d{6}$/.test(c)))return false;
 const {provinceCode,cityCode,districtCode}=region;
 if(!/^\d{2}0000$/.test(provinceCode)||cityCode.slice(0,2)!==provinceCode.slice(0,2)||districtCode.slice(0,2)!==provinceCode.slice(0,2))return false;
 // 普通地级市/直辖县级行政区划以00结尾；独立县级城市可同码选择。
 return cityCode.endsWith('00')?cityCode.slice(0,4)===districtCode.slice(0,4)&&districtCode!==cityCode:cityCode===districtCode;
}
module.exports={isValidRegion};
