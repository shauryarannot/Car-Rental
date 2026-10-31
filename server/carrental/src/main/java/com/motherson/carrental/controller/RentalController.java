package com.motherson.carrental.controller;

import com.motherson.carrental.entity.Rental;
import com.motherson.carrental.enums.BenefitType;
import com.motherson.carrental.service.RentalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rentals")
public class RentalController {

    private final RentalService rentalService;

    public RentalController(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    // Admin only: every rental in the system
    @GetMapping
    public List<Rental> getAll(Authentication auth) {
        requireAdmin(auth);
        return rentalService.getAll();
    }

    // The logged-in customer's own rentals
    @GetMapping("/my")
    public List<Rental> getMine(Authentication auth) {
        return rentalService.getMine(auth.getName());
    }

    // The owner or an admin
    @GetMapping("/{id}")
    public Rental getById(@PathVariable Long id, Authentication auth) {
        return rentalService.getByIdFor(id, auth.getName(), isAdmin(auth));
    }

    // Admin only: rental history of any customer
    @GetMapping("/customer/{customerId}")
    public List<Rental> getHistory(@PathVariable Long customerId, Authentication auth) {
        requireAdmin(auth);
        return rentalService.getHistory(customerId);
    }

    // The customer comes from the token, not from the request
    @PostMapping
    public ResponseEntity<Rental> rent(@RequestParam Long vehicleId,
                                       @RequestParam int days,
                                       @RequestParam(required = false) BenefitType benefit,
                                       @RequestParam(required = false) String couponCode,
                                       Authentication auth) {
        Rental rental = rentalService.rent(auth.getName(), vehicleId, days, benefit, couponCode);
        return ResponseEntity.status(HttpStatus.CREATED).body(rental);
    }

    // Only the owner can return a rental
    @PutMapping("/{id}/return")
    public Rental returnVehicle(@PathVariable Long id, Authentication auth) {
        return rentalService.returnVehicle(id, auth.getName(), isAdmin(auth));
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }

    private void requireAdmin(Authentication auth) {
        if (!isAdmin(auth)) {
            throw new AccessDeniedException("Admin only");
        }
    }
}