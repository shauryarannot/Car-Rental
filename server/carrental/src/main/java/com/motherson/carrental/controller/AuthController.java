package com.motherson.carrental.controller;

import com.motherson.carrental.dto.AuthResponse;
import com.motherson.carrental.dto.LoginRequest;
import com.motherson.carrental.dto.RegisterRequest;
import com.motherson.carrental.entity.Customer;
import com.motherson.carrental.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public Customer register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }
}