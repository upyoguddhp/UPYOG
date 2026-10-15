// Local stand-in for the remote globalConfigs.js (S3) that index.html used to load.
var globalConfigs = (function () {
  var configMap = {
    STATE_LEVEL_TENANT_ID: "hp",
    ENABLE_SINGLEINSTANCE: false,
    GMAPS_API_KEY: "",
    JWT_TOKEN: "ZWdvdi11c2VyLWNsaWVudDo=",
  };
  var getConfig = function (key) {
    return configMap[key];
  };
  return { getConfig: getConfig };
})();
