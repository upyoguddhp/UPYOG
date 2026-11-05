import React from "react";

import {
  initPGRComponents,
  PGRReducers,
} from "@upyog/digit-ui-module-pgr";
import { initFSMComponents } from "@upyog/digit-ui-module-fsm";
import {
  PTModule,
  PTLinks,
  PTComponents,
  NewPTModule,
  NewPTLinks,
} from "@upyog/digit-ui-module-pt";
import { MCollectModule, MCollectLinks, initMCollectComponents } from "@upyog/digit-ui-module-mcollect";
import { initDSSComponents } from "@upyog/digit-ui-module-dss";
import {
  PaymentModule,
  PaymentLinks,
  paymentConfigs,
} from "@upyog/digit-ui-module-common";
import { DigitUI } from "@upyog/digit-ui-module-core";
import { initLibraries } from "@upyog/digit-ui-libraries";
import {
  HRMSModule,
  initHRMSComponents,
} from "@upyog/digit-ui-module-hrms";
import {
  TLModule,
  TLLinks,
  NewTLModule,
  NewTLLinks,
  initTLComponents,
} from "@upyog/digit-ui-module-tl";
import { GBModule, GBLinks } from "@upyog/digit-ui-module-grbg";
import { BOOKINGModule, BOOKINGLinks } from "@upyog/digit-ui-module-booking";
import { REQSVCModule, REQSVCLinks } from "@upyog/digit-ui-module-reqsvc";
import { GRIEVANCEModule, GRIEVANCELinks } from "@upyog/digit-ui-module-grievance";
import { HPNOCModule, HPNOCLinks } from "@upyog/digit-ui-module-hpnoc";
import { HPPAYModule, HPPAYLinks } from "@upyog/digit-ui-module-payments";
import { HPWORKModule, HPWORKCard } from "@upyog/digit-ui-module-hpwork";
import { OTSModule, OTSLinks } from "@upyog/digit-ui-module-ots";
import { FEEDBACKModule, FEEDBACKLinks } from "@upyog/digit-ui-module-feedback";
import {
  PTRModule,
  PTRLinks,
  PTRComponents,
} from "@upyog-niua/upyog-ui-module-ptr";
import { initReceiptsComponents, ReceiptsModule } from "@upyog/digit-ui-module-receipts";
import { initOBPSComponents } from "@upyog/digit-ui-module-obps";
import { initNOCComponents } from "@upyog/digit-ui-module-noc";
import { initEngagementComponents } from "@upyog/digit-ui-module-engagement";
import { initWSComponents } from "@upyog/digit-ui-module-ws";
import { initCustomisationComponents } from "./Customisations";
import { initCommonPTComponents } from "@upyog/digit-ui-module-commonpt";
import { initBillsComponents } from "@upyog/digit-ui-module-bills";
// import { initReportsComponents } from "@egovernments/digit-ui-module-reports";

initLibraries();

const enabledModules = [
  "PGR",
  "FSM",
  "Payment",
  "PT",
  "QuickPayLinks",
  "DSS",
  "NDSS",
  "MCollect",
  "HRMS",
  "TL",
  "Receipts",
  "OBPS",
  "NOC",
  "Engagement",
  "CommonPT",
  "WS",
  "Reports",
  "Bills",
  "SW",
  "BillAmendment",
  "FireNoc",
  "Birth",
  "Death",
  "PTR",
  "NewTL",
  "PROPERTY",
  "GB",
  "BOOKING",
  "REQSVC",
  "GRIEVANCE",
  "HPNOC",
  "HPPAY",
  "HPWORK",
  "OTS",
  "FEEDBACK"
];
window.Digit.ComponentRegistryService.setupRegistry({
  ...paymentConfigs,
  PTModule,
  PTLinks,
  PaymentModule,
  PaymentLinks,
  ...PTComponents,
  MCollectLinks,
  MCollectModule,
  HRMSModule,
  TLModule,
  TLLinks,
  NewTLModule,
  NewTLLinks,
  PROPERTYModule: NewPTModule,
  PROPERTYLinks: NewPTLinks,
  GBModule,
  GBLinks,
  BOOKINGModule,
  BOOKINGLinks,
  REQSVCModule,
  REQSVCLinks,
  GRIEVANCEModule,
  GRIEVANCELinks,
  HPNOCModule,
  HPNOCLinks,
  HPPAYModule,
  HPPAYLinks,
  HPWORKModule,
  HPWORKCard,
  OTSModule,
  OTSLinks,
  FEEDBACKModule,
  FEEDBACKLinks,
  ReceiptsModule,
  PTRModule,
  PTRLinks,
  ...PTRComponents,
});

initPGRComponents();
initFSMComponents();
initDSSComponents();
initMCollectComponents();
initHRMSComponents();
initTLComponents();
initReceiptsComponents();
initOBPSComponents();
initNOCComponents();
initEngagementComponents();
initWSComponents();
initCommonPTComponents();
initBillsComponents();
// initReportsComponents();
initCustomisationComponents();

const moduleReducers = (initData) => ({
  pgr: PGRReducers(initData),
});

function App() {
  const stateCode =
    window.globalConfigs?.getConfig("STATE_LEVEL_TENANT_ID") ||
    process.env.REACT_APP_STATE_LEVEL_TENANT_ID;
  if (!stateCode) {
    return <h1>stateCode is not defined</h1>;
  }
  return (
    <DigitUI
      stateCode={stateCode}
      enabledModules={enabledModules}
      moduleReducers={moduleReducers}
    />
  );
}

export default App;
