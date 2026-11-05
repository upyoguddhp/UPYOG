// Text comes only from the localization service (module seeded from localization/hpworkMessages.js).
// A missing key shows the key itself, never a local copy of the text.
export const wrkText = (t, key, params = {}) => t(key, params);
