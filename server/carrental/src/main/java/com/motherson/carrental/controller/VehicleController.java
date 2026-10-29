package com.motherson.carrental.controller;

import com.motherson.carrental.entity.Vehicle;
import com.motherson.carrental.service.VehicleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @GetMapping
    public List<Vehicle> getAll() {
        return vehicleService.getAll();
    }

    @GetMapping("/available")
    public List<Vehicle> getAvailable() {
        return vehicleService.getAvailable();
    }

    @GetMapping("/category/{categoryId}")
    public List<Vehicle> getByCategory(@PathVariable Long categoryId) {
        return vehicleService.getByCategory(categoryId);
    }

    @GetMapping("/search")
    public List<Vehicle> search(@RequestParam String name) {
        return vehicleService.search(name);
    }

    @GetMapping("/{id}")
    public Vehicle getById(@PathVariable Long id) {
        return vehicleService.getById(id);
    }

    @PostMapping
    public ResponseEntity<Vehicle> create(@RequestBody Vehicle vehicle) {
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicleService.create(vehicle));
    }

    @PutMapping("/{id}")
    public Vehicle update(@PathVariable Long id, @RequestBody Vehicle vehicle) {
        return vehicleService.update(id, vehicle);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        vehicleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}