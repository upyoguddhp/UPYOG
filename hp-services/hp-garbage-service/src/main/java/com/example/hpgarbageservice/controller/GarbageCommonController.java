package com.example.hpgarbageservice.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.hpgarbageservice.model.GarbageCommonRequest;
import com.example.hpgarbageservice.service.GarbageCommonService;

@RestController
@RequestMapping("/garbage-common")
public class GarbageCommonController {

    @Autowired
    private GarbageCommonService service;

//    @PostMapping("/_create")
    public ResponseEntity<GarbageCommonRequest> create(@RequestBody GarbageCommonRequest garbageCommonRequest) {
        return ResponseEntity.ok(service.create(garbageCommonRequest));
    }

//    @PostMapping("/collection-unit/_update")
//    public ResponseEntity<List<GarbageAccount>> update(@RequestBody GarbageAccountRequest createGarbageRequest) {
//        return ResponseEntity.ok(service.update(createGarbageRequest));
//    }
//
//    @PostMapping("/collection-unit/_search")
//    public ResponseEntity<List<GarbageAccount>> search(@RequestBody SearchCriteriaGarbageAccountRequest searchCriteriaGarbageAccountRequest) {
//        return ResponseEntity.ok(service.searchGarbageAccounts(searchCriteriaGarbageAccountRequest));
//    }
}
