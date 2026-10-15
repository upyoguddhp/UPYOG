package org.upyog.chb.util;

import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.response.ResponseInfo;
import org.springframework.stereotype.Component;

<<<<<<< HEAD
@Component
public class ResponseInfoFactory {

    public ResponseInfo createResponseInfoFromRequestInfo(final RequestInfo requestInfo, final Boolean success) {
=======
/**
 * This utility class is responsible for creating standardized ResponseInfo objects
 * for the Community Hall Booking module.
 */
@Component
public class ResponseInfoFactory {

    public ResponseInfo createResponseInfoFromRequestInfo(final RequestInfo requestInfo, final boolean success) {
>>>>>>> niua-upstream/niua-dev-2.0

        final String apiId = requestInfo != null ? requestInfo.getApiId() : "";
        final String ver = requestInfo != null ? requestInfo.getVer() : "";
        Long ts = null;
<<<<<<< HEAD
        if(requestInfo!=null)
            ts = requestInfo.getTs();
        final String resMsgId = "uief87324"; // FIXME : Hard-coded
        final String msgId = requestInfo != null ? requestInfo.getMsgId() : "";
        final String responseStatus = success ? "successful" : "failed";

        return ResponseInfo.builder().apiId(apiId).ver(ver).ts(ts).resMsgId(resMsgId).msgId(msgId).resMsgId(resMsgId)
                .status(responseStatus).build();
    }

}
=======
        if (requestInfo != null) {
            ts = requestInfo.getTs();
        }
        final String resMsgId = requestInfo != null ? requestInfo.getMsgId() : "";
        final String msgId = requestInfo != null ? requestInfo.getMsgId() : "";
        final String responseStatus = success ? "successful" : "failed";

        return ResponseInfo.builder().apiId(apiId).ver(ver).ts(ts).resMsgId(resMsgId).msgId(msgId)
                .status(responseStatus).build();
    }

}
>>>>>>> niua-upstream/niua-dev-2.0
