package com.motherson.carrental.controller;

import com.motherson.carrental.entity.Rental;
import com.motherson.carrental.enums.BenefitType;
import com.motherson.carrental.service.RentalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rentals")
public class RentalController {

    private final RentalService rentalService;

    public RentalController(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @GetMapping
    public List<Rental> getAll() {
        return rentalService.getAll();
    }

    @GetMapping("/{id}")
    public Rental getById(@PathVariable Long id) {
        return rentalService.getById(id);
    }

    @GetMapping("/customer/{customerId}")
    public List<Rental> getHistory(@PathVariable Long customerId) {
        return rentalService.getHistory(customerId);
    }

    @PostMapping
    public ResponseEntity<Rental> rent(@RequestParam Long customerId,
                                       @RequestParam Long vehicleId,
                                       @RequestParam int days,
                                       @RequestParam(required = false) BenefitType benefit,
                                       @RequestParam(required = false) String couponCode) {
        Rental rental = rentalService.rent(customerId, vehicleId, days, benefit, couponCode);
        return ResponseEntity.status(HttpStatus.CREATED).body(rental);
    }

    @PutMapping("/{id}/return")
    public Rental returnVehicle(@PathVariable Long id) {
        return rentalService.returnVehicle(id);
    }
}