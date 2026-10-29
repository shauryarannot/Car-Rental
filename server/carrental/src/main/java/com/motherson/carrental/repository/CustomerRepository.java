package com.motherson.carrental.repository;

import com.motherson.carrental.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<Customer> findByActiveTrue();

    boolean existsByEmail(String email);
}