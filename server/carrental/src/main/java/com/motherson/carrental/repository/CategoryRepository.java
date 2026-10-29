package com.motherson.carrental.repository;

import com.motherson.carrental.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}