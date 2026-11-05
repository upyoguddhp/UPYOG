import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Redirect, Switch, useRouteMatch } from "react-router-dom";
import ApplicationView from "./ApplicationView";
import BookingFlow from "./BookingFlow";
import MyBookings from "./MyBookings";

const SVC = ":svc(site|asset)";

// Routes for the booking module (MDMS citymodule code BOOKING -> /digit-ui/citizen/booking):
//   <svc>/new/<step>, <svc>/my-bookings, <svc>/application/:applicationNumber   (svc = site | asset)
const BookingApp = () => {
  const { path } = useRouteMatch();
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // plain array: <Switch> only looks at its direct children, never inside a Fragment
  const routes = [
    <PrivateRoute key="new" path={`${path}/${SVC}/new`} component={BookingFlow} />,
    <PrivateRoute key="list" path={`${path}/${SVC}/my-bookings`} component={MyBookings} />,
    <PrivateRoute key="view" path={`${path}/${SVC}/application/:applicationNumber`} component={ApplicationView} />,
  ];
  // citizens get the dashboard chrome (core CitizenShell) and the page's own breadcrumbs
  if (!isEmployee) {
    return (
      <span className="bkg-citizen" style={{ width: "100%" }}>
        <Switch>
          {routes}
          <Redirect to={`${path}/site/my-bookings`} />
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

export default BookingApp;
