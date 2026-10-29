package com.motherson.carrental.service;

import com.motherson.carrental.entity.DiscountCoupon;
import com.motherson.carrental.enums.CouponType;
import com.motherson.carrental.exception.DiscountCouponNotFoundException;
import com.motherson.carrental.repository.DiscountCouponRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DiscountCouponService {

	private final DiscountCouponRepository couponRepository;

	public DiscountCouponService(DiscountCouponRepository couponRepository) {
		this.couponRepository = couponRepository;
	}

	public List<DiscountCoupon> getAll() {
		return couponRepository.findAll();
	}

	public DiscountCoupon getById(Long id) {
		return couponRepository.findById(id).orElseThrow(() -> new DiscountCouponNotFoundException(id));
	}

	public DiscountCoupon create(DiscountCoupon coupon) {
		validate(coupon);
		if (couponRepository.existsByCode(coupon.getCode())) {
			throw new IllegalArgumentException("Coupon code already exists");
		}
		return couponRepository.save(coupon);
	}

	public DiscountCoupon update(Long id, DiscountCoupon updated) {
		DiscountCoupon existing = getById(id);
		validate(updated);
		boolean codeChanged = !existing.getCode().equals(updated.getCode());
		if (codeChanged && couponRepository.existsByCode(updated.getCode())) {
			throw new IllegalArgumentException("Coupon code already exists");
		}
		existing.setCode(updated.getCode());
		existing.setCouponType(updated.getCouponType());
		existing.setDiscountPercent(updated.getDiscountPercent());
		existing.setMinDays(updated.getMinDays());
		existing.setMaxDays(updated.getMaxDays());
		return couponRepository.save(existing);
	}

	public void delete(Long id) {
		couponRepository.delete(getById(id));
	}

	private void validate(DiscountCoupon coupon) {
		if (coupon.getCode() == null || coupon.getCode().isBlank()) {
			throw new IllegalArgumentException("Coupon code is required");
		}
		coupon.setCode(coupon.getCode().trim().toUpperCase());

		if (coupon.getCouponType() == null) {
			throw new IllegalArgumentException("Coupon type is required");
		}

		BigDecimal percent = coupon.getDiscountPercent();
		if (percent == null || percent.compareTo(BigDecimal.ZERO) <= 0 || percent.compareTo(new BigDecimal("50")) > 0) {
			throw new IllegalArgumentException("Discount percent must be between 1 and 50");
		}

		if (coupon.getCouponType() == CouponType.FIRST_RENTAL && percent.compareTo(new BigDecimal("50")) != 0) {
			throw new IllegalArgumentException("First-rental discount must be exactly 50%");
		}

		if (coupon.getCouponType() == CouponType.DURATION) {
			Integer min = coupon.getMinDays();
			Integer max = coupon.getMaxDays();
			if (min == null || max == null) {
				throw new IllegalArgumentException("Duration coupon needs minDays and maxDays");
			}
			if (min < 1 || max > 30 || min > max) {
				throw new IllegalArgumentException("Duration coupon days must satisfy 1 <= minDays <= maxDays <= 30");
			}
		} else {
			coupon.setMinDays(null);
			coupon.setMaxDays(null);
		}
	}

	public DiscountCoupon getByCode(String code) {
		return couponRepository.findByCode(code.trim().toUpperCase())
				.orElseThrow(() -> new DiscountCouponNotFoundException(code));
	}
}