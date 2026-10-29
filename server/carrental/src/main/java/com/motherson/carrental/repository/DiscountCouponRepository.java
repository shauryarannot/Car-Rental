package com.motherson.carrental.repository;

import com.motherson.carrental.entity.DiscountCoupon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DiscountCouponRepository extends JpaRepository<DiscountCoupon, Long> {

    boolean existsByCode(String code);

    Optional<DiscountCoupon> findByCode(String code);
}