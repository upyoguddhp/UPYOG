package org.egov.pt.web.controllers;

import org.egov.pt.service.UmeedDashboardService;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import org.egov.pt.models.RequestInfoWrapper;
import org.egov.pt.models.data.DataItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.http.MediaType;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

//@RestController
//@RequestMapping("/data-dashboard")
//public class UmeedDashboardController {
//
//	@Autowired
//	private UmeedDashboardService umeedDashboardService;
//
//	@PostMapping(value = "/data-metrics", produces = MediaType.APPLICATION_JSON_VALUE)
//	public ResponseEntity<StreamingResponseBody> getMetrics(@RequestBody RequestInfoWrapper requestInfoWrapper) {
//
//		StreamingResponseBody stream = outputStream -> {
//
//			BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(outputStream));
//
//			writer.write("{\"data\":[");
//			AtomicBoolean first = new AtomicBoolean(true);
//			umeedDashboardService.prepareDataMetrics(requestInfoWrapper, dataItem -> {
//
//				try {
//					ObjectMapper mapper = new ObjectMapper();
//
//					if (!first.get()) {
//						writer.write(",");
//					}
//
//					writer.write(mapper.writeValueAsString(dataItem));
//					writer.flush();
//					first.set(false);
//
//				} catch (IOException ex) {
//
//                    // client disconnected
//                    System.out.println(
//                            "Client disconnected");
//
//                } catch (Exception ex) {
//
//                    ex.printStackTrace();
//                }
//			});
//
//			writer.write("]}");
//			writer.flush();
//		};
//		
//		return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(stream);
//	}
//}


@RestController
@Slf4j
@RequestMapping("/data-dashboard")   
public class UmeedDashboardController {

  @Autowired
  private UmeedDashboardService umeedDashboardService;

//  @PostMapping("/data-metrics")
//  public ResponseEntity<?> prepareDataMetrics(
//          @RequestBody RequestInfoWrapper requestInfoWrapper) {
//
//      return ResponseEntity.ok(
//              umeedDashboardService.prepareDataMetrics(null)
//      );
//  }
//}
  
  @PostMapping("/data-metrics")
  public ResponseEntity<List<DataItem>> prepareDataMetrics(
          @RequestBody RequestInfoWrapper requestInfoWrapper,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "5") int size) {

      List<DataItem> response =
              umeedDashboardService.prepareDataMetrics(
                      requestInfoWrapper,
                      page,
                      size);

      return ResponseEntity.ok(response);
  }
}
  
