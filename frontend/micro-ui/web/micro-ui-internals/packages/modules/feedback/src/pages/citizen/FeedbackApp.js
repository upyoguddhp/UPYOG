import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Redirect, Switch, useRouteMatch } from "react-router-dom";
import FeedbackAcknowledgement from "./Acknowledgement";
import FeedbackView from "./FeedbackView";
import MyFeedback from "./MyFeedback";
import NewFeedback from "./NewFeedback";

// Routes for the Feedback module (MDMS citymodule code FEEDBACK -> /digit-ui/citizen/feedback):
//   new, acknowledgement, my-feedback, application/:applicationNo
const FeedbackApp = () => {
  const { path } = useRouteMatch();
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // plain array: <Switch> only looks at its direct children, never inside a Fragment
  const routes = [
    <PrivateRoute key="new" path={`${path}/new`} component={NewFeedback} />,
    <PrivateRoute key="ack" path={`${path}/acknowledgement`} component={FeedbackAcknowledgement} />,
    <PrivateRoute key="list" path={`${path}/my-feedback`} component={MyFeedback} />,
    <PrivateRoute key="view" path={`${path}/application/:applicationNo`} component={FeedbackView} />,
  ];
  // citizens get the dashboard chrome (core CitizenShell) and the page's own breadcrumbs
  if (!isEmployee) {
    return (
      <span className="fdb-citizen" style={{ width: "100%" }}>
        <Switch>
          {routes}
          <Redirect to={`${path}/new`} />
        </Switch>
      </span>
    );
  }
  return (
    <span className="fdb-citizen" style={{ width: "100%" }}>
      <Switch>
        <AppContainer>
          <BackButton>Back</BackButton>
          {routes}
        </AppContainer>
      </Switch>
    </span>
  );
};

export default FeedbackApp;
