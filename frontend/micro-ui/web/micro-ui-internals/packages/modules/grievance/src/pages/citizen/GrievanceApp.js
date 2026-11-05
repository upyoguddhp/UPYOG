import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Redirect, Switch, useRouteMatch } from "react-router-dom";
import ApplicationView from "./ApplicationView";
import MyGrievances from "./MyGrievances";
import GrievanceFlow from "./GrievanceFlow";

// Routes for the Grievance module (MDMS citymodule code GRIEVANCE -> /digit-ui/citizen/grievance):
//   new/<step>, my-grievances, application/:applicationNumber
const GrievanceApp = () => {
  const { path } = useRouteMatch();
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // plain array: <Switch> only looks at its direct children, never inside a Fragment
  const routes = [
    <PrivateRoute key="new" path={`${path}/new`} component={GrievanceFlow} />,
    <PrivateRoute key="list" path={`${path}/my-grievances`} component={MyGrievances} />,
    <PrivateRoute key="view" path={`${path}/application/:applicationNumber`} component={ApplicationView} />,
  ];
  // citizens get the dashboard chrome (core CitizenShell) and the page's own breadcrumbs
  if (!isEmployee) {
    return (
      <span className="bkg-citizen" style={{ width: "100%" }}>
        <Switch>
          {routes}
          <Redirect to={`${path}/my-grievances`} />
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

export default GrievanceApp;
