import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Redirect, Switch, useRouteMatch } from "react-router-dom";
import ApplicationView from "./ApplicationView";
import MyRequests from "./MyRequests";
import RequestFlow from "./RequestFlow";

// Routes for the NOC module (MDMS citymodule code HPNOC -> /digit-ui/citizen/hpnoc):
//   new/<step>, my-requests, application/:applicationNumber
const HpnocApp = () => {
  const { path } = useRouteMatch();
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // plain array: <Switch> only looks at its direct children, never inside a Fragment
  const routes = [
    <PrivateRoute key="new" path={`${path}/new`} component={RequestFlow} />,
    <PrivateRoute key="list" path={`${path}/my-requests`} component={MyRequests} />,
    <PrivateRoute key="view" path={`${path}/application/:applicationNumber`} component={ApplicationView} />,
  ];
  // citizens get the dashboard chrome (core CitizenShell) and the page's own breadcrumbs
  if (!isEmployee) {
    return (
      <span className="bkg-citizen" style={{ width: "100%" }}>
        <Switch>
          {routes}
          <Redirect to={`${path}/my-requests`} />
        </Switch>
      </span>
    );
  }
  return (
    <span className="bkg-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          <BackButton>Back</BackButton>
          {routes}
        </AppContainer>
      </Switch>
    </span>
  );
};

export default HpnocApp;
