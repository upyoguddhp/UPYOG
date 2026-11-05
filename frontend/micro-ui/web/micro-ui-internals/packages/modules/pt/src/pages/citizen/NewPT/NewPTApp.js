import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import NewPropertyRegistration from "./index";
import MyProperties from "./MyProperties";
import ApplicationView from "./ApplicationView";

// Routes for the HP "NewPT" module (MDMS citymodule code PROPERTY -> /digit-ui/citizen/property, employees at /digit-ui/employee/property).
const NewPTApp = () => {
  const { path } = useRouteMatch();
  const isAck = window.location.href.includes("/acknowledgement");
  const isEmployee = Digit.UserService.getUser()?.info?.type === "EMPLOYEE";
  // citizens get the dashboard chrome (core CitizenShell) and the page's own breadcrumbs
  if (!isEmployee) {
    return (
      <span className="pt-citizen npt-citizen" style={{ width: "100%" }}>
        <Switch>
          <PrivateRoute path={`${path}/new-registration`} component={NewPropertyRegistration} />
          <PrivateRoute path={`${path}/my-properties`} component={MyProperties} />
          <PrivateRoute path={`${path}/application/:propertyId`} component={ApplicationView} />
        </Switch>
      </span>
    );
  }
  return (
    <span className="pt-citizen npt-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          {isAck ? null : <BackButton>Back</BackButton>}
          <PrivateRoute path={`${path}/new-registration`} component={NewPropertyRegistration} />
          <PrivateRoute path={`${path}/my-properties`} component={MyProperties} />
          <PrivateRoute path={`${path}/application/:propertyId`} component={ApplicationView} />
        </AppContainer>
      </Switch>
    </span>
  );
};

export default NewPTApp;
