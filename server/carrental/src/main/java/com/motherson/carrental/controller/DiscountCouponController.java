package com.motherson.carrental.controller;

import com.motherson.carrental.entity.DiscountCoupon;
import com.motherson.carrental.service.DiscountCouponService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
public class DiscountCouponController {

    private final DiscountCouponService couponService;

    public DiscountCouponController(DiscountCouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping
    public List<DiscountCoupon> getAll() {
        return couponService.getAll();
    }

    @GetMapping("/{id}")
    public DiscountCoupon getById(@PathVariable Long id) {
        return couponService.getById(id);
    }

    @PostMapping
    public ResponseEntity<DiscountCoupon> create(@RequestBody DiscountCoupon coupon) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.create(coupon));
    }

    @PutMapping("/{id}")
    public DiscountCoupon update(@PathVariable Long id, @RequestBody DiscountCoupon coupon) {
        return couponService.update(id, coupon);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponService.delete(id);
        return ResponseEntity.noContent().build();
    }
}