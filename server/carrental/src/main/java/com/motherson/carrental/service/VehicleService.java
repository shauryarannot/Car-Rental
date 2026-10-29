package com.motherson.carrental.service;

import com.motherson.carrental.entity.Category;
import com.motherson.carrental.entity.Vehicle;
import com.motherson.carrental.exception.VehicleNotFoundException;
import com.motherson.carrental.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class VehicleService {

	private final VehicleRepository vehicleRepository;
	private final CategoryService categoryService;

	public VehicleService(VehicleRepository vehicleRepository, CategoryService categoryService) {
		this.vehicleRepository = vehicleRepository;
		this.categoryService = categoryService;
	}

	public List<Vehicle> getAll() {
		return vehicleRepository.findAll();
	}

	public List<Vehicle> getAvailable() {
		return vehicleRepository.findByAvailableTrue();
	}

	public Vehicle getById(Long id) {
		return vehicleRepository.findById(id).orElseThrow(() -> new VehicleNotFoundException(id));
	}

	public List<Vehicle> getByCategory(Long categoryId) {
		categoryService.getById(categoryId); // throws CategoryNotFoundException if invalid
		return vehicleRepository.findByCategoryId(categoryId);
	}

	public List<Vehicle> search(String name) {
		return vehicleRepository.findByNameContainingIgnoreCase(name);
	}

	public Vehicle create(Vehicle vehicle) {
		validate(vehicle);
		vehicle.setCategory(categoryService.getById(vehicle.getCategory().getId()));
		return vehicleRepository.save(vehicle);
	}

	public Vehicle update(Long id, Vehicle updated) {
		Vehicle existing = getById(id);
		validate(updated);
		existing.setName(updated.getName());
		existing.setDailyRate(updated.getDailyRate());
		existing.setAvailable(updated.isAvailable());
		existing.setCategory(categoryService.getById(updated.getCategory().getId()));
		return vehicleRepository.save(existing);
	}

	public void delete(Long id) {
		vehicleRepository.delete(getById(id));
	}

	private void validate(Vehicle vehicle) {
		if (vehicle.getCategory() == null || vehicle.getCategory().getId() == null) {
			throw new IllegalArgumentException("Vehicle must have a category id");
		}
		BigDecimal rate = vehicle.getDailyRate();
		if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
			throw new IllegalArgumentException("Daily rate must be greater than 0");
		}
	}

	public void setAvailable(Long id, boolean available) {
		Vehicle vehicle = getById(id);
		vehicle.setAvailable(available);
		vehicleRepository.save(vehicle);
	}

	// Cheapest available vehicle in another category that costs more than this one
	public Vehicle findUpgradeFor(Vehicle vehicle) {
		return vehicleRepository
				.findByAvailableTrueAndCategoryIdNotAndDailyRateGreaterThanOrderByDailyRateAsc(
						vehicle.getCategory().getId(), vehicle.getDailyRate())
				.stream().findFirst()
				.orElseThrow(() -> new IllegalArgumentException("No upgrade vehicle is available"));
	}
}