import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import NewTradeRegistration from "./index";
import MyRegistrations from "./MyRegistrations";
import ApplicationView from "./ApplicationView";
import LifecycleApp from "./Lifecycle";

// Routes for the HP "NewTL" module (MDMS citymodule code NewTL -> /digit-ui/citizen/newtl).
const NewTLApp = () => {
  const { path } = useRouteMatch();
  const isAck = window.location.href.includes("/acknowledgement");
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // citizens get the dashboard chrome (core CitizenShell) and the page's own breadcrumbs
  if (!isEmployee) {
    return (
      <span className="tl-citizen ntl-citizen" style={{ width: "100%" }}>
        <Switch>
          <PrivateRoute path={`${path}/new-registration`} component={NewTradeRegistration} />
          <PrivateRoute path={`${path}/my-registrations`} component={MyRegistrations} />
          <PrivateRoute path={`${path}/application/:applicationNumber`} component={ApplicationView} />
          <PrivateRoute path={`${path}/:mode(renew|modify|close)/:applicationNumber`} component={LifecycleApp} />
        </Switch>
      </span>
    );
  }
  return (
    <span className="tl-citizen ntl-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          {isAck ? null : <BackButton>Back</BackButton>}
          <PrivateRoute path={`${path}/new-registration`} component={NewTradeRegistration} />
          <PrivateRoute path={`${path}/my-registrations`} component={MyRegistrations} />
          <PrivateRoute path={`${path}/application/:applicationNumber`} component={ApplicationView} />
          <PrivateRoute path={`${path}/:mode(renew|modify|close)/:applicationNumber`} component={LifecycleApp} />
        </AppContainer>
      </Switch>
    </span>
  );
};

export default NewTLApp;
