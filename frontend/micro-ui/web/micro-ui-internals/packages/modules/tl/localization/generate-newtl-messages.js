// Builds localization/rainmaker-tl.newtl.json (body for POST /localization/messages/v1/_upsert)
// from localization/newTLMessages.js, so the UI catalogue and the uploaded messages never drift.
//   node localization/generate-newtl-messages.js
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const src = fs.readFileSync(path.join(__dirname, "newTLMessages.js"), "utf8").replace(/export const /g, "const ");
const ctx = {};
vm.runInNewContext(src + "\nthis.NTL_MESSAGES = NTL_MESSAGES;", ctx);

const locales = { en: "en_IN", hi: "hi_IN" };
const messages = [];
Object.entries(ctx.NTL_MESSAGES).forEach(([code, texts]) =>
  Object.entries(locales).forEach(([lang, locale]) => messages.push({ code, message: texts[lang], module: /^(ACTION_TEST_|NTL_MENU_)/.test(code) ? "rainmaker-common" : "rainmaker-tl", locale }))
);
const out = { RequestInfo: { apiId: "Rainmaker" }, tenantId: "hp", messages };
fs.writeFileSync(path.join(__dirname, "rainmaker-tl.newtl.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`${messages.length} messages written`);
