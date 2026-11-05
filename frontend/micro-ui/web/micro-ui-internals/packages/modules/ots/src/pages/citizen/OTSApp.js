import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Redirect, Switch, useRouteMatch } from "react-router-dom";
import ApplicationView from "./ApplicationView";
import MyApplications from "./MyApplications";
import OTSFlow from "./OTSFlow";

// Routes for the OTS module (MDMS citymodule code OTS -> /digit-ui/citizen/ots):
//   new/<step>, my-applications, application/:applicationNumber
const OTSApp = () => {
  const { path } = useRouteMatch();
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // plain array: <Switch> only looks at its direct children, never inside a Fragment
  const routes = [
    <PrivateRoute key="new" path={`${path}/new`} component={OTSFlow} />,
    <PrivateRoute key="list" path={`${path}/my-applications`} component={MyApplications} />,
    <PrivateRoute key="view" path={`${path}/application/:applicationNumber`} component={ApplicationView} />,
  ];
  if (!isEmployee) {
    return (
      <span className="ots-citizen" style={{ width: "100%" }}>
        <Switch>
          {routes}
          <Redirect to={`${path}/my-applications`} />
        </Switch>
      </span>
    );
  }
  return (
    <span className="ots-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          <BackButton>Back</BackButton>
          {routes}
        </AppContainer>
      </Switch>
    </span>
  );
};

export default OTSApp;
