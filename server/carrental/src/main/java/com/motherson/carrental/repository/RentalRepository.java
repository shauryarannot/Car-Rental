package com.motherson.carrental.repository;

import com.motherson.carrental.entity.Rental;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RentalRepository extends JpaRepository<Rental, Long> {

    List<Rental> findByCustomerIdOrderByStartDateDesc(Long customerId);

    boolean existsByCustomerId(Long customerId);
}