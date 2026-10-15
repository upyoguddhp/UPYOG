package org.egov.asset.web.controllers;

<<<<<<< HEAD
import org.egov.asset.web.models.AssetRequest;
import org.egov.asset.web.models.AssetResponse;
import org.egov.asset.web.models.ErrorRes;
import org.egov.asset.web.models.RequestInfo;
import org.junit.Test;
import org.junit.Ignore;
import org.junit.runner.RunWith;
import org.springframework.test.context.junit4.SpringRunner;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.egov.asset.TestConfiguration;

    import java.util.ArrayList;
    import java.util.HashMap;
    import java.util.List;
    import java.util.Map;

import static org.mockito.Matchers.any;
import static org.mockito.Mockito.when;
=======
import org.egov.asset.TestConfiguration;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;

>>>>>>> niua-upstream/niua-dev-2.0
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
<<<<<<< HEAD
* API tests for V1ApiController
*/
@Ignore
@RunWith(SpringRunner.class)
@WebMvcTest(AssetControllerV1.class)
@Import(TestConfiguration.class)
public class AssetV1ApiControllerTest {
=======
 * API tests for V1ApiController
 */
@Disabled
@ExtendWith(SpringExtension.class)
@WebMvcTest(AssetControllerV1.class)
@Import(TestConfiguration.class)
class AssetV1ApiControllerTest {
>>>>>>> niua-upstream/niua-dev-2.0

    @Autowired
    private MockMvc mockMvc;

    @Test
<<<<<<< HEAD
    public void v1AssetsCreatePostSuccess() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void v1AssetsCreatePostFailure() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_create").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void v1AssetsSearchPostSuccess() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void v1AssetsSearchPostFailure() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_search").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

    @Test
    public void v1AssetsUpdatePostSuccess() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isOk());
    }

    @Test
    public void v1AssetsUpdatePostFailure() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_update").contentType(MediaType
        .APPLICATION_JSON_UTF8))
        .andExpect(status().isBadRequest());
    }

=======
    void v1AssetsCreatePostSuccess() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_create").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void v1AssetsCreatePostFailure() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_create").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void v1AssetsSearchPostSuccess() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_search").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void v1AssetsSearchPostFailure() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_search").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void v1AssetsUpdatePostSuccess() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_update").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    void v1AssetsUpdatePostFailure() throws Exception {
        mockMvc.perform(post("/asset-services/v1/assets/_update").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }
>>>>>>> niua-upstream/niua-dev-2.0
}
