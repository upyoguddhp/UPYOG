package org.egov.asset.util;

import com.fasterxml.jackson.databind.ObjectMapper;
<<<<<<< HEAD
import org.egov.asset.repository.ServiceRequestRepository;
import org.egov.asset.web.models.Role;
import org.egov.asset.web.models.User;
import org.egov.asset.web.models.workflow.ProcessInstanceResponse;

import digit.models.coremodels.UserDetailResponse;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.beans.factory.annotation.Value;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
=======
import digit.models.coremodels.UserDetailResponse;
import org.egov.asset.repository.ServiceRequestRepository;
import org.egov.asset.web.models.Role;
import org.egov.asset.web.models.User;
import org.egov.tracer.model.CustomException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
>>>>>>> niua-upstream/niua-dev-2.0

@Component
public class UserUtil {

<<<<<<< HEAD

    private ObjectMapper mapper;

    private ServiceRequestRepository serviceRequestRepository;
=======
    private static final String LAST_MODIFIED_DATE = "lastModifiedDate";
    private static final String PWD_EXPIRY_DATE = "pwdExpiryDate";

    private final ObjectMapper mapper;
    private final ServiceRequestRepository serviceRequestRepository;
>>>>>>> niua-upstream/niua-dev-2.0

    @Value("${egov.user.create.path}")
    private String userCreateEndpoint;

    @Value("${egov.user.search.path}")
    private String userSearchEndpoint;

    @Value("${egov.user.update.path}")
    private String userUpdateEndpoint;

<<<<<<< HEAD
    @Autowired
=======
>>>>>>> niua-upstream/niua-dev-2.0
    public UserUtil(ObjectMapper mapper, ServiceRequestRepository serviceRequestRepository) {
        this.mapper = mapper;
        this.serviceRequestRepository = serviceRequestRepository;
    }

    /**
     * Returns UserDetailResponse by calling user service with given uri and object
<<<<<<< HEAD
     * @param userRequest Request object for user service
     * @param uri The address of the endpoint
     * @return Response from user service as parsed as userDetailResponse
     */

    public UserDetailResponse userCall(Object userRequest, StringBuilder uri) {
        String dobFormat = null;
        if(uri.toString().contains(userSearchEndpoint)  || uri.toString().contains(userUpdateEndpoint))
            dobFormat="yyyy-MM-dd";
        else if(uri.toString().contains(userCreateEndpoint))
            dobFormat = "dd/MM/yyyy";
        try{
        	Object responseObject = serviceRequestRepository.fetchResult(uri, userRequest);
            LinkedHashMap responseMap = (LinkedHashMap) responseObject;
            parseResponse(responseMap,dobFormat);
            UserDetailResponse userDetailResponse = mapper.convertValue(responseMap,UserDetailResponse.class);
            return userDetailResponse;
        }
        catch(IllegalArgumentException  e)
        {
            throw new CustomException("IllegalArgumentException","ObjectMapper not able to convertValue in userCall");
        }
    }


    /**
     * Parses date formats to long for all users in responseMap
     * @param responeMap LinkedHashMap got from user api response
     */

    public void parseResponse(LinkedHashMap responeMap, String dobFormat){
        List<LinkedHashMap> users = (List<LinkedHashMap>)responeMap.get("user");
        String format1 = "dd-MM-yyyy HH:mm:ss";
        if(users!=null){
            users.forEach( map -> {
                        map.put("createdDate",dateTolong((String)map.get("createdDate"),format1));
                        if((String)map.get("lastModifiedDate")!=null)
                            map.put("lastModifiedDate",dateTolong((String)map.get("lastModifiedDate"),format1));
                        if((String)map.get("dob")!=null)
                            map.put("dob",dateTolong((String)map.get("dob"),dobFormat));
                        if((String)map.get("pwdExpiryDate")!=null)
                            map.put("pwdExpiryDate",dateTolong((String)map.get("pwdExpiryDate"),format1));
                    }
            );
=======
     *
     * @param userRequest Request object for user service
     * @param uri         The address of the endpoint
     * @return Response from user service as parsed as userDetailResponse
     */
    public UserDetailResponse userCall(Object userRequest, StringBuilder uri) {
        String dobFormat = null;
        if (uri.toString().contains(userSearchEndpoint) || uri.toString().contains(userUpdateEndpoint)) {
            dobFormat = "yyyy-MM-dd";
        } else if (uri.toString().contains(userCreateEndpoint)) {
            dobFormat = "dd/MM/yyyy";
        }
        try {
            Object responseObject = serviceRequestRepository.fetchResult(uri, userRequest);
            Map<String, Object> responseMap = (Map<String, Object>) responseObject;
            parseResponse(responseMap, dobFormat);
            return mapper.convertValue(responseMap, UserDetailResponse.class);
        } catch (IllegalArgumentException e) {
            throw new CustomException("IllegalArgumentException", "ObjectMapper not able to convertValue in userCall");
        }
    }

    /**
     * Parses date formats to long for all users in responseMap
     *
     * @param responeMap LinkedHashMap got from user api response
     * @param dobFormat  date of birth format
     */
    public void parseResponse(Map<String, Object> responeMap, String dobFormat) {
        List<LinkedHashMap<String, Object>> users = (List<LinkedHashMap<String, Object>>) responeMap.get("user");
        String format1 = "dd-MM-yyyy HH:mm:ss";
        if (users != null) {
            users.forEach(map -> {
                map.put("createdDate", dateTolong((String) map.get("createdDate"), format1));
                if (map.get(LAST_MODIFIED_DATE) != null) {
                    map.put(LAST_MODIFIED_DATE, dateTolong((String) map.get(LAST_MODIFIED_DATE), format1));
                }
                if (map.get("dob") != null) {
                    map.put("dob", dateTolong((String) map.get("dob"), dobFormat));
                }
                if (map.get(PWD_EXPIRY_DATE) != null) {
                    map.put(PWD_EXPIRY_DATE, dateTolong((String) map.get(PWD_EXPIRY_DATE), format1));
                }
            });
>>>>>>> niua-upstream/niua-dev-2.0
        }
    }

    /**
     * Converts date to long
<<<<<<< HEAD
     * @param date date to be parsed
     * @param format Format of the date
     * @return Long value of date
     */
    private Long dateTolong(String date,String format){
        SimpleDateFormat f = new SimpleDateFormat(format);
        Date d = null;
        try {
            d = f.parse(date);
        } catch (ParseException e) {
            throw new CustomException("INVALID_DATE_FORMAT","Failed to parse date format in user");
        }
        return  d.getTime();
=======
     *
     * @param date   date to be parsed
     * @param format Format of the date
     * @return Long value of date
     */
    private Long dateTolong(String date, String format) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
        try {
            if (format.contains("HH")) {
                return LocalDateTime.parse(date, formatter).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
            }
            return LocalDate.parse(date, formatter).atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli();
        } catch (DateTimeParseException e) {
            throw new CustomException("INVALID_DATE_FORMAT", "Failed to parse date format in user");
        }
>>>>>>> niua-upstream/niua-dev-2.0
    }

    /**
     * enriches the userInfo with statelevel tenantId and other fields
<<<<<<< HEAD
     * @param mobileNumber
     * @param tenantId
     * @param userInfo
     */
    public void addUserDefaultFields(String mobileNumber,String tenantId, User userInfo){
=======
     *
     * @param mobileNumber mobile number of the user
     * @param tenantId     tenant identifier
     * @param userInfo     user details to enrich
     */
    public void addUserDefaultFields(String mobileNumber, String tenantId, User userInfo) {
>>>>>>> niua-upstream/niua-dev-2.0
        Role role = getCitizenRole(tenantId);
        userInfo.setRoles(Collections.singletonList(role));
        userInfo.setType("CITIZEN");
        userInfo.setUserName(mobileNumber);
        userInfo.setTenantId(getStateLevelTenant(tenantId));
        userInfo.setActive(true);
    }

    /**
     * Returns role object for citizen
<<<<<<< HEAD
     * @param tenantId
     * @return
     */
    private Role getCitizenRole(String tenantId){
=======
     *
     * @param tenantId tenant identifier
     * @return citizen role
     */
    private Role getCitizenRole(String tenantId) {
>>>>>>> niua-upstream/niua-dev-2.0
        Role role = new Role();
        role.setCode("CITIZEN");
        role.setName("Citizen");
        role.setTenantId(getStateLevelTenant(tenantId));
        return role;
    }

<<<<<<< HEAD
    public String getStateLevelTenant(String tenantId){
        return tenantId.split("\\.")[0];
    }

}
=======
    public String getStateLevelTenant(String tenantId) {
        return tenantId.split("\\.")[0];
    }
}
>>>>>>> niua-upstream/niua-dev-2.0
