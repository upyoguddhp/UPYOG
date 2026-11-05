// Builds localization/rainmaker-reqsvc.json (body for POST /localization/messages/v1/_upsert)
// from localization/reqsvcMessages.js, so the UI catalogue and the uploaded messages never drift.
//   node localization/generate-reqsvc-messages.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "reqsvcMessages.js"), "utf8").replace(/export const /g, "const ");
const ctx = {};
vm.runInNewContext(src + "\nthis.RQS_MESSAGES = RQS_MESSAGES;", ctx);

const locales = { en: "en_IN", hi: "hi_IN" };
const messages = [];
Object.entries(ctx.RQS_MESSAGES).forEach(([code, texts]) =>
  Object.entries(locales).forEach(([lang, locale]) => messages.push({ code, message: texts[lang], module: /^(ACTION_TEST_|RQS_MENU_)/.test(code) ? "rainmaker-common" : "rainmaker-reqsvc", locale }))
);
const out = { RequestInfo: { apiId: "Rainmaker" }, tenantId: "hp", messages };
fs.writeFileSync(path.join(__dirname, "rainmaker-reqsvc.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${messages.length} messages written`);
