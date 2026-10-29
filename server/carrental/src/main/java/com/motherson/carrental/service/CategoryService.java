package com.motherson.carrental.service;

import com.motherson.carrental.entity.Category;
import com.motherson.carrental.exception.CategoryNotFoundException;
import com.motherson.carrental.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public Category getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new CategoryNotFoundException(id));
    }

    public Category create(Category category) {
        checkDiscount(category);
        return categoryRepository.save(category);
    }

    public Category update(Long id, Category updated) {
        Category existing = getById(id);
        checkDiscount(updated);
        existing.setName(updated.getName());
        existing.setDiscountPercent(updated.getDiscountPercent());
        return categoryRepository.save(existing);
    }

    public void delete(Long id) {
        Category existing = getById(id);
        categoryRepository.delete(existing);
    }

    private void checkDiscount(Category category) {
        BigDecimal d = category.getDiscountPercent();
        if (d != null && (d.compareTo(BigDecimal.ZERO) < 0 || d.compareTo(new BigDecimal("50")) > 0)) {
            throw new IllegalArgumentException("Category discount must be between 0 and 50");
        }
    }
}