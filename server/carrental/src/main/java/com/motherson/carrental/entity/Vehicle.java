package com.motherson.carrental.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private BigDecimal dailyRate;

    private boolean available = true;

    @ManyToOne(optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    public Vehicle() { }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public BigDecimal getDailyRate() { return dailyRate; }
    public void setDailyRate(BigDecimal dailyRate) { this.dailyRate = dailyRate; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
}