// Text comes only from the localization service (module seeded from localization/newTLMessages.js).
// A missing key shows the key itself, never a local copy of the text.
export const ntlText = (t, key, params = {}) => t(key, params);
