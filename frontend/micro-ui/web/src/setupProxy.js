const { createProxyMiddleware } = require("http-proxy-middleware");
const createProxy = createProxyMiddleware({
  target: process.env.REACT_APP_PROXY_URL,
  changeOrigin: true,
});
// DMS runs as its own service (upyog_DMS); point it at a local instance with REACT_APP_DMS_PROXY_URL
const dmsProxy = createProxyMiddleware({
  target: process.env.REACT_APP_DMS_PROXY_URL || process.env.REACT_APP_PROXY_URL,
  changeOrigin: true,
});
module.exports = function (app) {
  app.use("/hpud-dms-service", dmsProxy);
  [
    "/egov-mdms-service",
    "/mdms-v2",
    "/rdf-monitoring",
    "/egov-location",
    "/localization",
    "/egov-workflow-v2",
    "/pgr-services",
    "/filestore",
    "/egov-hrms",
    "/user-otp",
    "/user",
    "/fsm",
    "/billing-service",
    "/collection-services",
    "/pdf-service",
    "/pg-service",
    "/vehicle",
    "/vendor",
    "/property-services",
    "/garbage-service",
    "/tl-services",
    "/pet-services",
    "/chb-services",
    "/echallan-services",
    "/noc-services",
    "/adrvcanopy-services",
    "/asset-services",
    "/feedback-service",
    "/fsm-calculator/v1/billingSlab/_search",
  ].forEach((location) =>
    app.use(location, createProxy)
  );
};