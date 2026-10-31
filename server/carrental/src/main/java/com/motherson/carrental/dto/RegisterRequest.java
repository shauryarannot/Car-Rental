package com.motherson.carrental.dto;

public record RegisterRequest(String name, String email, String password,
                              String phone, String employeeId) { }