import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import ApplicationView from "./ApplicationView";
import Inbox from "./Inbox";

// Routes of the employee Work module (MDMS citymodule code HPWORK -> /digit-ui/employee/hpwork):
//   inbox, application/:service/:id?tenantId=
const HpworkApp = () => {
  const { path } = useRouteMatch();
  return (
    <span className="bkg-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          <BackButton>Back</BackButton>
          <PrivateRoute path={`${path}/inbox`} component={Inbox} />
          <PrivateRoute path={`${path}/application/:service/:id`} component={ApplicationView} />
        </AppContainer>
      </Switch>
    </span>
  );
};

export default HpworkApp;
