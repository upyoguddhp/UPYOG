// Local stand-in for the remote globalConfigs.js (S3) that index.html used to load.
var globalConfigs = (function () {
  var configMap = {
    STATE_LEVEL_TENANT_ID: "hp",
    DMS_URL: "/hpud-dms-service",
    ENABLE_SINGLEINSTANCE: false,
    GMAPS_API_KEY: "",
    JWT_TOKEN: "ZWdvdi11c2VyLWNsaWVudDo=",
    // HP Single Sign-On (environment specific)
    // Razorpay checkout (set per environment; the key id is public, the secret never belongs here)
    RAZOR_PAY_SCRIPT_URL: "https://checkout.razorpay.com/v1/checkout.js",
    RAZOR_PAY_KEY: "",
    RAZOR_PAY_CURRENCY: "INR",
    RAZOR_PAY_LOGO: "",
    SSO_SERVICE_ID: "10000180",
    SSO_SCRIPT_URL: "https://sso.hp.gov.in/nodeapi/iframe/sso-iframe.js",
    OFFICIAL_SSO_URL: "https://himparivar.hp.gov.in/sso-admin/GovLogin?service_id=22&app_unique=ED003",
  };
  var getConfig = function (key) {
    return configMap[key];
  };
  return { getConfig: getConfig };
})();
