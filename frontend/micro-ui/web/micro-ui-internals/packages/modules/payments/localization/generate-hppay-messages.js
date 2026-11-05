// Builds localization/rainmaker-hppay.json (body for POST /localization/messages/v1/_upsert)
// from localization/payMessages.js:   node localization/generate-hppay-messages.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "payMessages.js"), "utf8").replace(/export const /g, "const ");
const ctx = {};
vm.runInNewContext(src + "\nthis.PAY_MESSAGES = PAY_MESSAGES;", ctx);

const locales = { en: "en_IN", hi: "hi_IN" };
const messages = [];
Object.entries(ctx.PAY_MESSAGES).forEach(([code, texts]) =>
  Object.entries(locales).forEach(([lang, locale]) => messages.push({ code, message: texts[lang], module: /^(ACTION_TEST_|PAY_MENU_)/.test(code) ? "rainmaker-common" : "rainmaker-hppay", locale }))
);
const out = { RequestInfo: { apiId: "Rainmaker" }, tenantId: "hp", messages };
fs.writeFileSync(path.join(__dirname, "rainmaker-hppay.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${messages.length} messages written`);
