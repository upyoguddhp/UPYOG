import { Dropdown } from "@upyog/digit-ui-react-components";
import React, { useState, useEffect } from "react";
import { CustomButton, Menu } from "@upyog/digit-ui-react-components";
import { useHistory } from "react-router-dom";
import { allRoles, applyContext } from "./employeeContext";

const stringReplaceAll = (str = "", searcher = "", replaceWith = "") => {
  if (searcher == "") return str;
  while (str?.includes(searcher)) {
    str = str?.replace(searcher, replaceWith);
  }
  return str;
};

// untranslated city keys fall back to readable words (hp.shimla -> Shimla) instead of the raw key
const cityLabel = (t, code) => {
  const key = `TENANT_TENANTS_${stringReplaceAll(code, ".", "_")?.toUpperCase()}`;
  const v = t ? t(key) : key;
  if (v && v !== key) return v;
  return String(code || "").split(".").pop().split("_").map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(" ");
};

const ChangeCity = (prop) => {
  const [dropDownData, setDropDownData] = useState(null);
  const [selectCityData, setSelectCityData] = useState([]);
  const [selectedCity, setSelectedCity] = useState([]); //selectedCities?.[0]?.value
  const history = useHistory();
  const isDropdown = prop.dropdown || false;
  let selectedCities = [];

  const handleChangeCity = (city) => {
    setDropDownData(city);
    applyContext({ tenantId: city.value, role: "" });
  };

  useEffect(() => {
    let live = true;
    const tenants = (rs) => rs.map((role) => role.tenantId).filter((x) => x && x.indexOf(".") > 0);
    const show = (codes) => {
      const unique = codes.filter((item, i, ar) => ar.indexOf(item) === i);
      if (live) setSelectCityData(unique.map((uniCode) => ({ label: cityLabel(prop?.t, uniCode), value: uniCode })));
    };
    const fromRoles = tenants(allRoles());
    show(fromRoles);
    // cities the employee is mapped to in HRMS (jurisdictions) are offered as well
    const uuid = Digit.SessionStorage.get("citizen.userRequestObject")?.info?.uuid;
    if (uuid && Digit.HRMSService && Digit.HRMSService.search) {
      Digit.HRMSService.search(Digit.ULBService.getStateId(), {}, { uuids: uuid })
        .then((res) => {
          const e = (res && res.Employees && res.Employees[0]) || {};
          const mapped = (e.jurisdictions || []).map((j) => j.tenantId || j.boundary).filter((x) => x && x.indexOf(".") > 0);
          show(fromRoles.concat(mapped));
        })
        .catch(() => {});
    }
    return () => { live = false; };
  }, [dropDownData]);

  // if (isDropdown) {
  return (
    <div style={prop?.mobileView ? {color: "#767676"} : {}}>
      <Dropdown
        option={selectCityData}
        selected={selectCityData.find((cityValue) => cityValue.value === dropDownData?.value)}
        optionKey={"label"}
        select={handleChangeCity}
        freeze={true}
        customSelector={<label className="cp">{cityLabel(prop?.t, Digit.SessionStorage.get("Employee.tenantId"))}</label>}
      />
    </div>
  );
  // } else {
  //   return (
  //     <React.Fragment>
  //       <div style={{ marginBottom: "5px" }}>City</div>
  //       <div className="language-selector" style={{display: "flex", flexWrap: "wrap"}}>
  //         {selectCityData?.map((city, index) => (
  //           <div className="language-button-container" key={index}>
  //             <CustomButton
  //               selected={city.value === Digit.SessionStorage.get("Employee.tenantId")}
  //               text={city.label}
  //               onClick={() => handleChangeCity(city)}
  //             ></CustomButton>
  //           </div>
  //         ))}
  //       </div>
  //     </React.Fragment>
  //   );
  // }
};

export default ChangeCity;
