// Builds localization/rainmaker-ots.json (body for POST /localization/messages/v1/_upsert)
// from localization/otsMessages.js, so the UI catalogue and the uploaded messages never drift.
//   node localization/generate-ots-messages.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "otsMessages.js"), "utf8").replace(/export const /g, "const ");
const ctx = {};
vm.runInNewContext(src + "\nthis.OTS_MESSAGES = OTS_MESSAGES;", ctx);

const locales = { en: "en_IN", hi: "hi_IN" };
const messages = [];
Object.entries(ctx.OTS_MESSAGES).forEach(([code, texts]) =>
  Object.entries(locales).forEach(([lang, locale]) => messages.push({ code, message: texts[lang], module: /^(ACTION_TEST_|OTS_MENU_)/.test(code) ? "rainmaker-common" : "rainmaker-ots", locale }))
);
const out = { RequestInfo: { apiId: "Rainmaker" }, tenantId: "hp", messages };
fs.writeFileSync(path.join(__dirname, "rainmaker-ots.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${messages.length} messages written`);
