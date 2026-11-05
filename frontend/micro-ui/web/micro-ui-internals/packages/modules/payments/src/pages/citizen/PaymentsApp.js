import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Redirect, Switch, useRouteMatch } from "react-router-dom";
import Dues from "./Dues";
import History from "./History";
import PayResult from "./PayResult";
import ReceiptView from "./ReceiptView";

// Routes for Dues & payments (MDMS citymodule code HPPAY -> /digit-ui/citizen/hppay):
//   dues, result, history, receipt/:receiptNumber
const PaymentsApp = () => {
  const { path } = useRouteMatch();
  const isEmployee = (Digit.UserService.getUser()?.info || {}).type === "EMPLOYEE";
  // plain array: <Switch> only looks at its direct children, never inside a Fragment
  const routes = [
    <PrivateRoute key="dues" path={`${path}/dues`} component={Dues} />,
    <PrivateRoute key="result" path={`${path}/result`} component={PayResult} />,
    <PrivateRoute key="history" path={`${path}/history`} component={History} />,
    <PrivateRoute key="receipt" path={`${path}/receipt/:receiptNumber`} component={ReceiptView} />,
  ];
  if (!isEmployee) {
    return (
      <span className="bkg-citizen" style={{ width: "100%" }}>
        <Switch>
          {routes}
          <Redirect to={`${path}/dues`} />
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

export default PaymentsApp;
