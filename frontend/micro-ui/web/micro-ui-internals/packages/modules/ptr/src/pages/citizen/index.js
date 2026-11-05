import { AppContainer, BackButton, PrivateRoute } from "@upyog/digit-ui-react-components";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { shouldHideBackButton } from "../../utils";
import { useTranslation } from "react-i18next";
import NewPetRegistration from "./NewPet";
import NPRMyRegistrations from "./NewPet/MyRegistrations";
import NPRApplicationView from "./NewPet/ApplicationView";
import NPRRenewal from "./NewPet/Renewal";

const hideBackButtonConfig = [
  { screenPath: "petservice/new-application/acknowledgement" },
  { screenPath: "petservice/edit-application/acknowledgement" },

];

const App = () => {
  const { path, url, ...match } = useRouteMatch();
  const { t } = useTranslation();
  const inboxInitialState = {
    searchParams: {},
  };

  const PTRCreate = Digit?.ComponentRegistryService?.getComponent("PTRCreatePet");
  const PTRApplicationDetails = Digit?.ComponentRegistryService?.getComponent("PTRApplicationDetails");
  const PTRMyApplications = Digit?.ComponentRegistryService?.getComponent("PTRMyApplications");
 
  return (
    <span className={"pet-citizen"}style={{width:"100%"}}>
      <Switch>
        {/* HP pet registration (NewPet): dashboard chrome + its own breadcrumbs, no AppContainer / back button */}
        <PrivateRoute path={`${path}/petservice/new-registration`} component={NewPetRegistration} />
        <PrivateRoute path={`${path}/petservice/my-registrations`} component={NPRMyRegistrations} />
        <PrivateRoute path={`${path}/petservice/registration/:applicationNumber`} component={NPRApplicationView} />
        <PrivateRoute path={`${path}/petservice/renew/:applicationNumber`} component={NPRRenewal} />
        <AppContainer>
          {!shouldHideBackButton(hideBackButtonConfig) ? <BackButton>Back</BackButton> : ""}
          <PrivateRoute path={`${path}/petservice/new-application`} component={PTRCreate} />
          <PrivateRoute path={`${path}/petservice/application/:acknowledgementIds/:tenantId`} component={PTRApplicationDetails}></PrivateRoute>
          <PrivateRoute path={`${path}/petservice/my-applications`} component={PTRMyApplications}></PrivateRoute>
          {/* <PrivateRoute path={`${path}/petservice/my-payments`} component={PTMyPayments}></PrivateRoute> */}
          <PrivateRoute path={`${path}/petservice/search`} component={(props) => <Search {...props} t={t} parentRoute={path} />} />
        </AppContainer>
      </Switch>
    </span>
  );
};

export default App;