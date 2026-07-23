package org.egov.infra.mdms.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class TLInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        String method = request.getMethod();

        if (HttpMethod.GET.matches(method) || HttpMethod.POST.matches(method)) {
            return true;
        }

        response.sendError(HttpStatus.METHOD_NOT_ALLOWED.value());
        return false;
    }
}