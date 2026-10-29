package com.motherson.carrental.exception;

public class DiscountCouponNotFoundException extends RuntimeException {

    public DiscountCouponNotFoundException(Long id) {
        super("Discount coupon not found with id: " + id);
    }

    public DiscountCouponNotFoundException(String code) {
        super("Discount coupon not found with code: " + code);
    }
}