import { AppContainer, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import ApplicationView from "./ApplicationView";
import GenerateBills from "./GenerateBills";
import MasterData from "./MasterData";
import Masters from "./Masters";
import Arrears from "./Arrears";
import ChequeSettlement from "./ChequeSettlement";
import SearchBills from "./SearchBills";
import Inbox from "./Inbox";

// Routes of the employee Work module (MDMS citymodule code HPWORK -> /digit-ui/employee/hpwork):
//   inbox, application/:service/:id?tenantId=, bills/generate/:service (grbg | ppt)
const HpworkApp = () => {
  const { path } = useRouteMatch();
  return (
    <span className="bkg-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          <PrivateRoute path={`${path}/inbox`} component={Inbox} />
          <PrivateRoute path={`${path}/bills/generate/:service`} component={GenerateBills} />
          <PrivateRoute path={`${path}/bills/search/:service`} component={SearchBills} />
          <PrivateRoute path={`${path}/bills/arrears/:service`} component={Arrears} />
          <PrivateRoute path={`${path}/bills/cheque/:service`} component={ChequeSettlement} />
          <PrivateRoute path={`${path}/masters/:schemaCode`} component={MasterData} />
          <PrivateRoute exact path={`${path}/masters`} component={Masters} />
          <PrivateRoute path={`${path}/application/:service/:id`} component={ApplicationView} />
        </AppContainer>
      </Switch>
    </span>
  );
};

export default HpworkApp;
