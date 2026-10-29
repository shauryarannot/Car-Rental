package com.motherson.carrental.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    // Category discount in percent, e.g. 10 means 10%. Must not exceed 50.
    private BigDecimal discountPercent = BigDecimal.ZERO;

    public Category() { }   // JPA requires a no-arg constructor

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getDiscountPercent() { return discountPercent; }
    public void setDiscountPercent(BigDecimal discountPercent) { this.discountPercent = discountPercent; }
}