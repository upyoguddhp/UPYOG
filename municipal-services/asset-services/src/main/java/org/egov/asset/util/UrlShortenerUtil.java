package org.egov.asset.util;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
<<<<<<< HEAD
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
=======
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

>>>>>>> niua-upstream/niua-dev-2.0
import java.util.HashMap;

@Slf4j
@Component
public class UrlShortenerUtil {

<<<<<<< HEAD
    @Autowired
    private RestTemplate restTemplate;
=======
    private final RestTemplate restTemplate;
>>>>>>> niua-upstream/niua-dev-2.0

    @Value("${egov.url.shortner.host}")
    private String urlShortnerHost;

    @Value("${egov.url.shortner.endpoint}")
    private String urShortnerPath;

<<<<<<< HEAD
    public String getShortenedUrl(String url){

        HashMap<String,String> body = new HashMap<>();
        body.put("url",url);
        StringBuilder builder = new StringBuilder(urlShortnerHost);
        builder.append(urShortnerPath);
        String res = restTemplate.postForObject(builder.toString(), body, String.class);

        if(StringUtils.isEmpty(res)){
            log.error("URL_SHORTENING_ERROR", "Unable to shorten url: " + url); ;
            return url;
        }
        else return res;
    }


}
=======
    public UrlShortenerUtil(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String getShortenedUrl(String url) {
        HashMap<String, String> body = new HashMap<>();
        body.put("url", url);
        String res = restTemplate.postForObject(urlShortnerHost + urShortnerPath, body, String.class);

        if (StringUtils.isEmpty(res)) {
            log.error("URL_SHORTENING_ERROR", "Unable to shorten url: " + url);
            return url;
        }
        return res;
    }
}
>>>>>>> niua-upstream/niua-dev-2.0
