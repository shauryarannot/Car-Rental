package com.motherson.carrental.entity;

import com.motherson.carrental.enums.CouponType;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class DiscountCoupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CouponType couponType;

    @Column(nullable = false)
    private BigDecimal discountPercent;

    // Only used by DURATION coupons: the coupon applies when
    // minDays <= rental days <= maxDays
    private Integer minDays;
    private Integer maxDays;

    public DiscountCoupon() { }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public CouponType getCouponType() { return couponType; }
    public void setCouponType(CouponType couponType) { this.couponType = couponType; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }

    public Integer getMinDays() { return minDays; }
    public void setMinDays(Integer minDays) { this.minDays = minDays; }

    public Integer getMaxDays() { return maxDays; }
    public void setMaxDays(Integer maxDays) { this.maxDays = maxDays; }
}