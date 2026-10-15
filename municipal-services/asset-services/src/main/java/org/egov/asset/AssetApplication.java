package org.egov.asset;


import org.egov.tracer.config.TracerConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;

<<<<<<< HEAD
@Import({ TracerConfiguration.class })
@SpringBootApplication
@ComponentScan(basePackages = { "org.egov.asset", "org.egov.asset.web.controllers" , "org.egov.asset.config"})
public class AssetApplication {


    public static void main(String[] args) throws Exception {
=======
@Import({TracerConfiguration.class})
@SpringBootApplication
@ComponentScan(basePackages = {"org.egov.asset", "org.egov.asset.web.controllers", "org.egov.asset.config"})
public class AssetApplication {


    public static void main(String[] args) {
>>>>>>> niua-upstream/niua-dev-2.0
        SpringApplication.run(AssetApplication.class, args);
    }

}
