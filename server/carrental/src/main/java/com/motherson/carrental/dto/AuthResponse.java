package com.motherson.carrental.dto;

public record AuthResponse(String token, String role, Long customerId, String name) { }