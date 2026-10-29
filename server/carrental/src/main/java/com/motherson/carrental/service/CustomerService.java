package com.motherson.carrental.service;

import com.motherson.carrental.entity.Customer;
import com.motherson.carrental.exception.CustomerNotFoundException;
import com.motherson.carrental.repository.CustomerRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerService {

    private final CustomerRepository customerRepository;

    public CustomerService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // Only active customers are listed
    public List<Customer> getAll() {
        return customerRepository.findByActiveTrue();
    }

    public Customer getById(Long id) {
        return customerRepository.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));
    }

    public Customer create(Customer customer) {
        validate(customer);
        if (customerRepository.existsByEmail(customer.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        customer.setActive(true);
        return customerRepository.save(customer);
    }

    public Customer update(Long id, Customer updated) {
        Customer existing = getById(id);
        validate(updated);
        boolean emailChanged = !existing.getEmail().equalsIgnoreCase(updated.getEmail());
        if (emailChanged && customerRepository.existsByEmail(updated.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        existing.setName(updated.getName());
        existing.setEmail(updated.getEmail());
        existing.setPhone(updated.getPhone());
        existing.setEmployeeId(updated.getEmployeeId());
        return customerRepository.save(existing);
    }

    // Soft delete: the row stays, the customer is just deactivated
    public void deactivate(Long id) {
        Customer existing = getById(id);
        existing.setActive(false);
        customerRepository.save(existing);
    }

    private void validate(Customer customer) {
        if (customer.getName() == null || customer.getName().isBlank()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (customer.getEmail() == null || customer.getEmail().isBlank()) {
            throw new IllegalArgumentException("Customer email is required");
        }
    }
}