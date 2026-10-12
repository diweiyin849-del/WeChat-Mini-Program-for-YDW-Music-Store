const config = require('../config');
function createCatalog(platform, storage) {
  if (config.mode === 'demo') return require('./demo-catalog').createDemoCatalog(storage,platform);
  return require('./cloud-catalog').createCloudCatalog(platform);
}
module.exports = {createCatalog};
