package com.motherson.carrental.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.motherson.carrental.entity.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByActiveTrue();

    boolean existsByEmail(String email);

    // Used by login to find a user by email
    Optional<Customer> findByEmail(String email);
}