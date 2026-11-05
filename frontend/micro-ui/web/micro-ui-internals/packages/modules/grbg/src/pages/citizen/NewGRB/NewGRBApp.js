import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Switch, useRouteMatch } from "react-router-dom";
import NewGarbageRegistration from "./index";
import MyRegistrations from "./MyRegistrations";
import ApplicationView from "./ApplicationView";
import LifecycleEntry from "./LifecycleEntry";
import ModifyGarbage from "./ModifyGarbage";

const CloseGarbage = () => <LifecycleEntry kind="close" />;

// Routes for the HP "NewGRB" module (MDMS citymodule code GB -> /digit-ui/citizen/gb).
const NewGRBApp = () => {
  const { path } = useRouteMatch();
  const isAck = window.location.href.includes("/acknowledgement");
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // citizens get the dashboard chrome (core CitizenShell) and the page's own breadcrumbs
  if (!isEmployee) {
    return (
      <span className="grb-citizen" style={{ width: "100%" }}>
        <Switch>
          <PrivateRoute path={`${path}/new-registration`} component={NewGarbageRegistration} />
          <PrivateRoute path={`${path}/my-registrations`} component={MyRegistrations} />
          <PrivateRoute path={`${path}/application/:applicationNumber`} component={ApplicationView} />
          <PrivateRoute path={`${path}/modify/:applicationNumber`} component={ModifyGarbage} />
          <PrivateRoute path={`${path}/close/:applicationNumber`} component={CloseGarbage} />
        </Switch>
      </span>
    );
  }
  return (
    <span className="grb-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          {isAck ? null : <BackButton>Back</BackButton>}
          <PrivateRoute path={`${path}/new-registration`} component={NewGarbageRegistration} />
          <PrivateRoute path={`${path}/my-registrations`} component={MyRegistrations} />
          <PrivateRoute path={`${path}/application/:applicationNumber`} component={ApplicationView} />
          <PrivateRoute path={`${path}/modify/:applicationNumber`} component={ModifyGarbage} />
          <PrivateRoute path={`${path}/close/:applicationNumber`} component={CloseGarbage} />
        </AppContainer>
      </Switch>
    </span>
  );
};

export default NewGRBApp;
