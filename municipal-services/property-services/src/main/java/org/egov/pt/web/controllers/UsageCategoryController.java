//package org.egov.pt.web.controllers;
//
//import org.egov.pt.service.UsageCategoryUpdateService;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//
//import lombok.extern.slf4j.Slf4j;
//
//@Slf4j
//
//@RestController
//@RequestMapping("/usage-category")
//public class UsageCategoryController {
//
//    @Autowired
//    private UsageCategoryUpdateService usageCategoryUpdateService;
//
//    @PostMapping("/update")
//    public String updateUsageCategory() {
//
//        usageCategoryUpdateService.updateUsageCategory();
//
//        return "Updated Successfully";
//    }
//}
