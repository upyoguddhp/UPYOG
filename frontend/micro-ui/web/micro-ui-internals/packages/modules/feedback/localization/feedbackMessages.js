// Single source of truth for every citizen Feedback label.
// Screens call t(key); this catalogue is also what gets uploaded to the localization
// service (module "rainmaker-feedback"), see feedback/localization/rainmaker-feedback.json.
// fdbText() falls back to the English text here so a screen never shows a raw key
// while the localization upload is pending.
export const FDB_MESSAGES = {
  // ---- citizen home menu (served from MDMS ACCESSCONTROL-ACTIONS-TEST; uploaded to rainmaker-common)
  ACTION_TEST_FEEDBACK: { en: "Feedback", hi: "प्रतिक्रिया" },
  FDB_MENU_NEW: { en: "Give feedback", hi: "प्रतिक्रिया दें" },
  FDB_MENU_LIST: { en: "My feedback", hi: "मेरी प्रतिक्रियाएँ" },

  // ---- titles, crumbs
  FDB_CRUMB_HOME: { en: "Home", hi: "मुखपृष्ठ" },
  FDB_CRUMB_FEEDBACK: { en: "Feedback", hi: "प्रतिक्रिया" },
  FDB_NEW_TITLE: { en: "Share your feedback", hi: "अपनी प्रतिक्रिया साझा करें" },
  FDB_NEW_SUB: { en: "Tell us how a service worked for you. It helps your ULB improve.", hi: "बताइए कि कोई सेवा आपके लिए कैसी रही। इससे आपके शहरी निकाय को सुधार में मदद मिलती है।" },
  FDB_LIST_TITLE: { en: "My feedback", hi: "मेरी प्रतिक्रियाएँ" },
  FDB_LIST_SUB: { en: "Feedback you have submitted, newest first.", hi: "आपके द्वारा दी गई प्रतिक्रियाएँ, नवीनतम पहले।" },
  FDB_NEW_BTN: { en: "Give feedback", hi: "प्रतिक्रिया दें" },

  // ---- form
  FDB_SELECT_SERVICE: { en: "Which service is your feedback about?", hi: "आपकी प्रतिक्रिया किस सेवा के बारे में है?" },
  FDB_SELECT_PLACEHOLDER: { en: "Select a service", hi: "सेवा चुनें" },
  FDB_PICK_SERVICE_HINT: { en: "Select a service to see its questions.", hi: "प्रश्न देखने के लिए सेवा चुनें।" },
  FDB_GENERAL_SERVICE: { en: "General feedback", hi: "सामान्य प्रतिक्रिया" },
  FDB_GENERAL_RATING: { en: "How would you rate your overall experience?", hi: "आप अपने समग्र अनुभव को कैसे आंकेंगे?" },
  FDB_GENERAL_COMMENT: { en: "Anything else you would like to tell us?", hi: "क्या आप हमें कुछ और बताना चाहेंगे?" },
  FDB_RESPONSE_PH: { en: "Type your response", hi: "अपना उत्तर लिखें" },
  FDB_STAR: { en: "{{n}} out of 5", hi: "5 में से {{n}}" },
  FDB_RATING_1: { en: "Poor", hi: "खराब" },
  FDB_RATING_2: { en: "Fair", hi: "ठीक-ठाक" },
  FDB_RATING_3: { en: "Good", hi: "अच्छा" },
  FDB_RATING_4: { en: "Very good", hi: "बहुत अच्छा" },
  FDB_RATING_5: { en: "Excellent", hi: "उत्कृष्ट" },
  FDB_SUBMIT: { en: "Submit feedback", hi: "प्रतिक्रिया जमा करें" },
  FDB_SUBMITTING: { en: "Submitting your feedback...", hi: "आपकी प्रतिक्रिया जमा की जा रही है..." },
  FDB_E_REQUIRED: { en: "This question is required", hi: "यह प्रश्न आवश्यक है" },
  FDB_E_RATING: { en: "Please choose a rating", hi: "कृपया रेटिंग चुनें" },
  FDB_E_SERVICE: { en: "Please select a service", hi: "कृपया सेवा चुनें" },
  FDB_E_MOBILE: { en: "Your profile has no mobile number. Update your profile and try again.", hi: "आपकी प्रोफ़ाइल में मोबाइल नंबर नहीं है। प्रोफ़ाइल अपडेट करके पुनः प्रयास करें।" },
  FDB_SUBMIT_FAILED: { en: "We could not submit your feedback. Please try again.", hi: "हम आपकी प्रतिक्रिया जमा नहीं कर सके। कृपया पुनः प्रयास करें।" },
  FDB_LOADING: { en: "Loading...", hi: "लोड हो रहा है..." },
  FDB_LOADING_FORM: { en: "Loading the feedback form...", hi: "प्रतिक्रिया फ़ॉर्म लोड हो रहा है..." },
  FDB_SERVICES_FAILED: { en: "Could not load the list of services. Please try again.", hi: "सेवाओं की सूची लोड नहीं हो सकी। कृपया पुनः प्रयास करें।" },
  FDB_QUESTIONS_FAILED: { en: "Could not load the questions. Please try again.", hi: "प्रश्न लोड नहीं हो सके। कृपया पुनः प्रयास करें।" },
  FDB_SEARCH_LIST: { en: "Type to search", hi: "खोजने के लिए लिखें" },
  FDB_NO_RESULTS: { en: "Nothing matches your search.", hi: "आपकी खोज से कुछ मेल नहीं खाता।" },
  FDB_RETRY: { en: "Retry", hi: "पुनः प्रयास करें" },

  // ---- acknowledgement
  FDB_ACK_TITLE: { en: "Thank you for your feedback", hi: "आपकी प्रतिक्रिया के लिए धन्यवाद" },
  FDB_ACK_SUB: { en: "Your feedback has been recorded.", hi: "आपकी प्रतिक्रिया दर्ज हो गई है।" },
  FDB_ACK_NUMBER: { en: "Feedback number", hi: "प्रतिक्रिया संख्या" },
  FDB_ACK_COPY: { en: "Copy number", hi: "संख्या कॉपी करें" },
  FDB_ACK_COPIED: { en: "Copied", hi: "कॉपी हो गया" },
  FDB_ACK_NOTE: { en: "It may take a minute to appear in My feedback.", hi: "इसे मेरी प्रतिक्रियाएँ में दिखने में एक मिनट लग सकता है।" },
  FDB_ACK_PRINT: { en: "Print", hi: "प्रिंट करें" },
  FDB_ACK_MINE: { en: "View my feedback", hi: "मेरी प्रतिक्रियाएँ देखें" },
  FDB_ACK_AGAIN: { en: "Give more feedback", hi: "और प्रतिक्रिया दें" },
  FDB_ACK_HOME: { en: "Back to home", hi: "मुखपृष्ठ पर वापस" },

  // ---- list
  FDB_FILTER_ALL: { en: "All", hi: "सभी" },
  FDB_FILTER_PROGRESS: { en: "Submitted", hi: "जमा" },
  FDB_FILTER_DONE: { en: "Closed", hi: "बंद" },
  FDB_SEARCH_PH: { en: "Search by number or service", hi: "संख्या या सेवा से खोजें" },
  FDB_LIST_EMPTY: { en: "You have not given any feedback yet", hi: "आपने अभी तक कोई प्रतिक्रिया नहीं दी है" },
  FDB_LIST_EMPTY_HINT: { en: "Pick a service and tell us how it went.", hi: "कोई सेवा चुनें और बताएँ कि अनुभव कैसा रहा।" },
  FDB_NO_RESULTS: { en: "Nothing matches your search", hi: "आपकी खोज से कुछ नहीं मिला" },
  FDB_CLEAR_FILTERS: { en: "Clear filters", hi: "फ़िल्टर हटाएँ" },
  FDB_LIST_FAILED: { en: "Could not load your feedback. Please try again.", hi: "आपकी प्रतिक्रियाएँ लोड नहीं हो सकीं। कृपया पुनः प्रयास करें।" },
  FDB_VIEW_OPEN: { en: "View", hi: "देखें" },

  // ---- detail page
  FDB_VIEW_TITLE: { en: "Feedback details", hi: "प्रतिक्रिया विवरण" },
  FDB_VIEW_STATUS: { en: "Status", hi: "स्थिति" },
  FDB_VIEW_NUMBER: { en: "Feedback number", hi: "प्रतिक्रिया संख्या" },
  FDB_VIEW_SERVICE: { en: "Service", hi: "सेवा" },
  FDB_VIEW_RATING: { en: "Rating", hi: "रेटिंग" },
  FDB_VIEW_SUBMITTED: { en: "Submitted on", hi: "जमा करने की तिथि" },
  FDB_VIEW_SOURCE: { en: "Submitted from", hi: "जमा करने का माध्यम" },
  FDB_VIEW_TYPE: { en: "Type", hi: "प्रकार" },
  FDB_VIEW_ANSWERS: { en: "Your responses", hi: "आपके उत्तर" },
  FDB_VIEW_NO_ANSWERS: { en: "No responses were recorded", hi: "कोई उत्तर दर्ज नहीं हुआ" },
  FDB_VIEW_TIMELINE: { en: "Progress", hi: "प्रगति" },
  FDB_VIEW_SUBMITTED_STEP: { en: "Feedback submitted", hi: "प्रतिक्रिया जमा की गई" },
  FDB_VIEW_PRINT: { en: "Print", hi: "प्रिंट करें" },
  FDB_VIEW_BACK: { en: "Back to my feedback", hi: "मेरी प्रतिक्रियाओं पर वापस" },
  FDB_VIEW_NOTFOUND: { en: "This feedback could not be found.", hi: "यह प्रतिक्रिया नहीं मिली।" },
  FDB_VIEW_FAILED: { en: "Could not load the feedback. Please try again.", hi: "प्रतिक्रिया लोड नहीं हो सकी। कृपया पुनः प्रयास करें।" },
  FDB_NOT_PROVIDED: { en: "Not provided", hi: "उपलब्ध नहीं" },

  // ---- status / type / source labels
  FDB_ST_SUBMITED: { en: "Submitted", hi: "जमा" },
  FDB_ST_CLOSED: { en: "Closed", hi: "बंद" },
  FDB_TYPE_POST_SERVICE: { en: "After using a service", hi: "सेवा के उपयोग के बाद" },
  FDB_SRC_WEB: { en: "Website", hi: "वेबसाइट" },
  FDB_SRC_MOBILE: { en: "Mobile app", hi: "मोबाइल ऐप" },
};

// Resolve a catalogue key: localization service first, English catalogue as the fallback.
