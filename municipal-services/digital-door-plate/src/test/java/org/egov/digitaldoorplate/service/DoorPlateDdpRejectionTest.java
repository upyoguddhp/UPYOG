package org.egov.digitaldoorplate.service;

import java.util.HashMap;
import java.util.Map;
import org.egov.common.contract.request.RequestInfo;
import org.egov.common.contract.request.User;
import org.egov.digitaldoorplate.model.DoorPlateDdpWorkflowRequest;
import org.egov.digitaldoorplate.model.DoorPlateDdpWorkflowResponse;
import org.egov.digitaldoorplate.util.ResponseInfoFactory;
import org.egov.tracer.model.CustomException;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DoorPlateDdpRejectionTest {
    @Test
    void rejectionWithoutActionDoesNotCallGarbageService() {
        DoorPlateService service = new DoorPlateService();
        GarbageAccountService garbage = mock(GarbageAccountService.class);
        ReflectionTestUtils.setField(service, "garbageAccountService", garbage);
        assertThrows(CustomException.class, () -> service.updateDdpWorkflow(request(null)));
        verifyNoInteractions(garbage);
    }

    @Test
    void forwardsReprintActionAndReturnsSavedState() {
        DoorPlateService service = new DoorPlateService();
        GarbageAccountService garbage = mock(GarbageAccountService.class);
        ReflectionTestUtils.setField(service, "garbageAccountService", garbage);
        ReflectionTestUtils.setField(service, "responseInfoFactory", mock(ResponseInfoFactory.class));
        DoorPlateDdpWorkflowRequest request = request("REPRINT");
        Map<String, Object> saved = new HashMap<>();
        saved.put("vendorPrintVerified", "REJECTED");
        saved.put("ddpRejectionAction", "REPRINT");
        saved.put("reprintCount", 4);
        saved.put("revalidateCount", 1);
        saved.put("isReadyForPrinting", true);
        saved.put("ddpPrintingDone", false);
        when(garbage.updateDdpWorkflowFields(eq(request.getRequestInfo()), eq("hp.Shimla"),
                eq("account"), eq("REJECTED"), isNull(), isNull(), isNull(), isNull(),
                isNull(), isNull(), isNull(), eq("Bad print"), eq("REPRINT"))).thenReturn(saved);
        DoorPlateDdpWorkflowResponse response = service.updateDdpWorkflow(request);
        assertEquals("REPRINT", response.getDdpRejectionAction());
        assertEquals(Integer.valueOf(4), response.getReprintCount());
        assertEquals(Integer.valueOf(1), response.getRevalidateCount());
        assertTrue(response.getIsReadyForPrinting());
        assertFalse(response.getDdpPrintingDone());
    }

    private DoorPlateDdpWorkflowRequest request(String action) {
        User user = new User();
        user.setUuid("user");
        RequestInfo info = new RequestInfo();
        info.setUserInfo(user);
        return DoorPlateDdpWorkflowRequest.builder().requestInfo(info).tenantId("hp.Shimla")
                .garbageAccountUuid("account").vendorPrintVerified("REJECTED")
                .ddpRejectionAction(action).ddpRejectionReason("Bad print").build();
    }
}
