package org.egov.demand.web.controller;



import static org.mockito.Mockito.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.MissingNode;

import java.util.ArrayList;

import org.egov.common.contract.request.RequestInfo;
import org.egov.demand.amendment.model.Amendment;
import org.egov.demand.amendment.model.AmendmentRequest;
import org.egov.demand.amendment.model.AmendmentUpdate;
import org.egov.demand.amendment.model.AmendmentUpdateRequest;
import org.egov.demand.amendment.model.Document;
import org.egov.demand.amendment.model.ProcessInstance;
import org.egov.demand.amendment.model.enums.AmendmentReason;
import org.egov.demand.amendment.model.enums.AmendmentStatus;
import org.egov.demand.model.AuditDetails;
import org.egov.demand.model.DemandDetail;
import org.egov.demand.service.AmendmentService;
import org.egov.demand.web.contract.RequestInfoWrapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@SpringBootTest
@AutoConfigureMockMvc
@ExtendWith(SpringExtension.class)
class AmendmentControllerTest {

    @Autowired
    private AmendmentController amendmentController;

    @MockBean
    private AmendmentService amendmentService;

    @Autowired
    private MockMvc mockMvc;

    private AmendmentUpdate createAmendmentUpdate(
            AmendmentStatus status,
            AuditDetails auditDetails,
            MissingNode additionalDetails,
            ProcessInstance workflow) {

        return new AmendmentUpdate(
                "42",
                "42",
                "42",
                auditDetails,
                additionalDetails,
                workflow,
                status,
                new ArrayList<>(),
                AmendmentReason.COURT_CASE_SETTLEMENT,
                "reasone",
                1L,
                1L);
    }

    @Test
    public void AmendmentPostSuccess() throws Exception {
        AmendmentRequest request = new AmendmentRequest();

        request.setAmendment(new Amendment(
                "42", "42", "42", "?", "42", "?",
                AmendmentReason.COURT_CASE_SETTLEMENT,
                "Just cause",
                AmendmentStatus.ACTIVE,
                new ProcessInstance(),
                new ArrayList<DemandDetail>(),
                new ArrayList<Document>(),
                1L,
                1L,
                new AuditDetails(),
                MissingNode.getInstance()));

        String json = new ObjectMapper().writeValueAsString(request);

        mockMvc.perform(post("/amendment/_create")
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void AmendmentPostFailure() throws Exception {
        mockMvc.perform(post("/amendment/_create")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void AmendmentSearchSuccess() throws Exception {
        RequestInfoWrapper wrapper = new RequestInfoWrapper();
        wrapper.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(wrapper);

        mockMvc.perform(post("/amendment/_search")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    @Test
    public void amendmentSearchFailure() throws Exception {
        mockMvc.perform(post("/amendment/_search")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void AmendmentUpdateSuccess() throws Exception {
        AmendmentUpdateRequest request = new AmendmentUpdateRequest();

        request.setAmendmentUpdate(createAmendmentUpdate(
                AmendmentStatus.ACTIVE,
                new AuditDetails(),
                MissingNode.getInstance(),
                new ProcessInstance()));

        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        mockMvc.perform(post("/amendment/_update")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    @Test
    public void amendmentUpdateFailure() throws Exception {
        mockMvc.perform(post("/amendment/_update")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateWith400Code() throws Exception {
        AmendmentRequest request = new AmendmentRequest();
        request.setAmendment(new Amendment());
        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void testCreateWithSuccess() throws Exception {
        when(amendmentService.create(any(AmendmentRequest.class)))
                .thenReturn(new Amendment());

        AmendmentRequest request = new AmendmentRequest();

        request.setAmendment(new Amendment(
                "42", "42", "42", "?", "42", "?",
                AmendmentReason.COURT_CASE_SETTLEMENT,
                "Just cause",
                AmendmentStatus.ACTIVE,
                new ProcessInstance(),
                new ArrayList<DemandDetail>(),
                new ArrayList<Document>(),
                1L,
                1L,
                new AuditDetails(),
                MissingNode.getInstance()));

        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isCreated());
    }

    @Test
    void testCreateSuccessWithRequestInfo() throws Exception {
        Amendment expected = new Amendment(
                "42", "42", "42", "?", "42", "?",
                AmendmentReason.COURT_CASE_SETTLEMENT,
                "Just cause",
                AmendmentStatus.ACTIVE,
                new ProcessInstance(),
                new ArrayList<DemandDetail>(),
                new ArrayList<Document>(),
                6L,
                6L,
                new AuditDetails(),
                MissingNode.getInstance());

        when(amendmentService.create(any(AmendmentRequest.class)))
                .thenReturn(expected);

        AmendmentRequest request = new AmendmentRequest();

        request.setAmendment(new Amendment(
                "42", "42", "42", "?", "42", "?",
                AmendmentReason.COURT_CASE_SETTLEMENT,
                "Just cause",
                AmendmentStatus.ACTIVE,
                new ProcessInstance(),
                new ArrayList<DemandDetail>(),
                new ArrayList<Document>(),
                1L,
                1L,
                new AuditDetails(),
                MissingNode.getInstance()));

        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_create")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isCreated());
    }

    @Test
    void testSearchWith400Code() throws Exception {
        RequestInfoWrapper wrapper = new RequestInfoWrapper();
        wrapper.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(wrapper);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_search")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void testUpdateWith400Code() throws Exception {
        AmendmentUpdateRequest request = new AmendmentUpdateRequest();
        request.setAmendmentUpdate(new AmendmentUpdate());
        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isBadRequest());
    }

    @Test
    void testUpdateSuccess() throws Exception {
        when(amendmentService.updateAmendment(any(AmendmentUpdateRequest.class)))
                .thenReturn(new Amendment());

        AmendmentUpdateRequest request = new AmendmentUpdateRequest();

        request.setAmendmentUpdate(createAmendmentUpdate(
                AmendmentStatus.ACTIVE,
                new AuditDetails(),
                MissingNode.getInstance(),
                new ProcessInstance()));

        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void testUpdateSuccessWithExpectedData() throws Exception {
        Amendment expected = new Amendment(
                "42", "42", "42", "?", "42", "?",
                AmendmentReason.COURT_CASE_SETTLEMENT,
                "Just cause",
                AmendmentStatus.ACTIVE,
                new ProcessInstance(),
                new ArrayList<DemandDetail>(),
                new ArrayList<Document>(),
                4L,
                4L,
                new AuditDetails(),
                MissingNode.getInstance());

        when(amendmentService.updateAmendment(any(AmendmentUpdateRequest.class)))
                .thenReturn(expected);

        AmendmentUpdateRequest request = new AmendmentUpdateRequest();

        request.setAmendmentUpdate(createAmendmentUpdate(
                AmendmentStatus.ACTIVE,
                new AuditDetails(),
                MissingNode.getInstance(),
                new ProcessInstance()));

        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void testUpdateSuccessWithRequestInfo() throws Exception {
        when(amendmentService.updateAmendment(any(AmendmentUpdateRequest.class)))
                .thenReturn(new Amendment());

        AmendmentUpdateRequest request = new AmendmentUpdateRequest();

        request.setAmendmentUpdate(createAmendmentUpdate(
                AmendmentStatus.INACTIVE,
                new AuditDetails(),
                MissingNode.getInstance(),
                new ProcessInstance()));

        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder)
                .andExpect(MockMvcResultMatchers.status().isOk());
    }

    @Test
    void testUpdateError() throws Exception {
        when(amendmentService.updateAmendment(any(AmendmentUpdateRequest.class)))
                .thenReturn(new Amendment());

        ArrayList<Document> documents = new ArrayList<>();
        documents.add(new Document());

        AmendmentUpdate update = new AmendmentUpdate(
                "42",
                "42",
                "42",
                new AuditDetails(),
                MissingNode.getInstance(),
                new ProcessInstance(),
                AmendmentStatus.ACTIVE,
                documents,
                AmendmentReason.COURT_CASE_SETTLEMENT,
                "reasone",
                1L,
                1L);

        AmendmentUpdateRequest request = new AmendmentUpdateRequest();
        request.setAmendmentUpdate(update);
        request.setRequestInfo(new RequestInfo());

        String json = new ObjectMapper().writeValueAsString(request);

        MockHttpServletRequestBuilder builder =
                MockMvcRequestBuilders.post("/amendment/_update")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json);

        ResultActions result = MockMvcBuilders.standaloneSetup(amendmentController)
                .build()
                .perform(builder);

        result.andExpect(MockMvcResultMatchers.status().isBadRequest());
    }
}