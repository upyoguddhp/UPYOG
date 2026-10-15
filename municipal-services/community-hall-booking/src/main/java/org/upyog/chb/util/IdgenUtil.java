package org.upyog.chb.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import digit.models.coremodels.IdGenerationRequest;
import digit.models.coremodels.IdGenerationResponse;
import digit.models.coremodels.IdRequest;
import digit.models.coremodels.IdResponse;
import org.egov.common.contract.request.RequestInfo;
import org.egov.tracer.model.CustomException;
<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
=======
>>>>>>> niua-upstream/niua-dev-2.0
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;
import org.upyog.chb.repository.ServiceRequestRepository;

import java.util.ArrayList;
import java.util.List;
<<<<<<< HEAD
import java.util.stream.Collectors;
=======
>>>>>>> niua-upstream/niua-dev-2.0

@Component
public class IdgenUtil {

    @Value("${egov.idgen.host}")
    private String idGenHost;

    @Value("${egov.idgen.path}")
    private String idGenPath;

<<<<<<< HEAD
    @Autowired
    private ObjectMapper mapper;

    @Autowired
    private ServiceRequestRepository restRepo;
=======
    private final ObjectMapper mapper;
    private final ServiceRequestRepository restRepo;

    public IdgenUtil(ObjectMapper mapper, ServiceRequestRepository restRepo) {
        this.mapper = mapper;
        this.restRepo = restRepo;
    }
>>>>>>> niua-upstream/niua-dev-2.0

    public List<String> getIdList(RequestInfo requestInfo, String tenantId, String idName, String idformat, Integer count) {
        List<IdRequest> reqList = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            reqList.add(IdRequest.builder().idName(idName).format(idformat).tenantId(tenantId).build());
        }

        IdGenerationRequest request = IdGenerationRequest.builder().idRequests(reqList).requestInfo(requestInfo).build();
        StringBuilder uri = new StringBuilder(idGenHost).append(idGenPath);
        IdGenerationResponse response = mapper.convertValue(restRepo.fetchResult(uri, request), IdGenerationResponse.class);

        List<IdResponse> idResponses = response.getIdResponses();

        if (CollectionUtils.isEmpty(idResponses))
            throw new CustomException("IDGEN ERROR", "No ids returned from idgen Service");

<<<<<<< HEAD
        return idResponses.stream().map(IdResponse::getId).collect(Collectors.toList());
    }
}
=======
        return idResponses.stream().map(IdResponse::getId).toList();
    }
}
>>>>>>> niua-upstream/niua-dev-2.0
