package org.egov.user.config;

import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;


public class TLInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler) throws Exception {

        String theMethod = request.getMethod();

        if (HttpMethod.GET.matches(theMethod)
                || HttpMethod.POST.matches(theMethod)) {

            return true;
        }
        else {
            response.sendError(HttpStatus.METHOD_NOT_ALLOWED.value());
            return false;
        }
        
    }
}