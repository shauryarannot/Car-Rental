package com.motherson.carrental.service;

import com.motherson.carrental.entity.Customer;
import com.motherson.carrental.entity.DiscountCoupon;
import com.motherson.carrental.entity.Rental;
import com.motherson.carrental.entity.Vehicle;
import com.motherson.carrental.enums.BenefitType;
import com.motherson.carrental.enums.RentalStatus;
import com.motherson.carrental.exception.RentalNotFoundException;
import com.motherson.carrental.repository.RentalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
public class RentalService {

	private static final int MAX_DAYS = 30;

	private final RentalRepository rentalRepository;
	private final CustomerService customerService;
	private final VehicleService vehicleService;
	private final DiscountCouponService couponService;

	public RentalService(RentalRepository rentalRepository, CustomerService customerService,
			VehicleService vehicleService, DiscountCouponService couponService) {
		this.rentalRepository = rentalRepository;
		this.customerService = customerService;
		this.vehicleService = vehicleService;
		this.couponService = couponService;
	}

	public List<Rental> getAll() {
		return rentalRepository.findAll();
	}

	public Rental getById(Long id) {
		return rentalRepository.findById(id).orElseThrow(() -> new RentalNotFoundException(id));
	}

	public List<Rental> getHistory(Long customerId) {
		customerService.getById(customerId); // 404 if the customer doesn't exist
		return rentalRepository.findByCustomerIdOrderByStartDateDesc(customerId);
	}

	@Transactional
	public Rental rent(Long customerId, Long vehicleId, int days, BenefitType benefit, String couponCode) {
		if (days < 1 || days > MAX_DAYS) {
			throw new IllegalArgumentException("Rental days must be between 1 and " + MAX_DAYS);
		}

		Customer customer = customerService.getById(customerId);
		if (!customer.isActive()) {
			throw new IllegalArgumentException("Customer is not active");
		}

		Vehicle selected = vehicleService.getById(vehicleId);
		if (!selected.isAvailable()) {
			throw new IllegalArgumentException("Vehicle is not available");
		}

		BenefitType type = (benefit == null) ? BenefitType.NONE : benefit;
		Vehicle rentedVehicle = selected;
		BigDecimal discountPercent = BigDecimal.ZERO;
		String appliedCode = null;

		// Only one benefit can be applied per rental
		switch (type) {
		case COUPON -> {
			DiscountCoupon coupon = findEligibleCoupon(couponCode, customer, days);
			discountPercent = coupon.getDiscountPercent();
			appliedCode = coupon.getCode();
		}
		case CATEGORY_DISCOUNT -> {
			BigDecimal categoryDiscount = selected.getCategory().getDiscountPercent();
			if (categoryDiscount == null || categoryDiscount.compareTo(BigDecimal.ZERO) <= 0) {
				throw new IllegalArgumentException("This category has no discount");
			}
			discountPercent = categoryDiscount;
		}
		case FREE_UPGRADE -> rentedVehicle = vehicleService.findUpgradeFor(selected);
		case NONE -> {
		}
		}

		// Price is based on the vehicle the customer selected, so an upgrade is free
		BigDecimal total = calculateTotal(selected.getDailyRate(), days, discountPercent);

		Rental rental = new Rental();
		rental.setCustomer(customer);
		rental.setVehicle(rentedVehicle);
		rental.setDays(days);
		rental.setStartDate(LocalDate.now());
		rental.setEndDate(LocalDate.now().plusDays(days));
		rental.setStatus(RentalStatus.ACTIVE);
		rental.setBenefitType(type);
		rental.setCouponCode(appliedCode);
		rental.setDiscountPercent(discountPercent);
		rental.setTotalAmount(total);

		Rental saved = rentalRepository.save(rental);
		vehicleService.setAvailable(rentedVehicle.getId(), false);
		return saved;
	}

	@Transactional
	public Rental returnVehicle(Long rentalId) {
		Rental rental = getById(rentalId);
		if (rental.getStatus() == RentalStatus.COMPLETED) {
			throw new IllegalArgumentException("Rental is already completed");
		}
		rental.setStatus(RentalStatus.COMPLETED);
		vehicleService.setAvailable(rental.getVehicle().getId(), true);
		return rentalRepository.save(rental);
	}

	// Checks that the coupon exists and that this customer and rental length
	// qualify for it
	private DiscountCoupon findEligibleCoupon(String couponCode, Customer customer, int days) {
		if (couponCode == null || couponCode.isBlank()) {
			throw new IllegalArgumentException("Coupon code is required when using a coupon");
		}
		DiscountCoupon coupon = couponService.getByCode(couponCode);

		switch (coupon.getCouponType()) {
		case FIRST_RENTAL -> {
			if (rentalRepository.existsByCustomerId(customer.getId())) {
				throw new IllegalArgumentException("First-rental discount is only for a customer's first rental");
			}
		}
		case DURATION -> {
			if (days < coupon.getMinDays() || days > coupon.getMaxDays()) {
				throw new IllegalArgumentException("Coupon is valid only for rentals of " + coupon.getMinDays() + " to "
						+ coupon.getMaxDays() + " days");
			}
		}
		case EMPLOYEE -> {
			if (customer.getEmployeeId() == null || customer.getEmployeeId().isBlank()) {
				throw new IllegalArgumentException("This coupon is only for Motherson employees");
			}
		}
		}
		return coupon;
	}

	// total = dailyRate x days, minus the discount percentage
	private BigDecimal calculateTotal(BigDecimal dailyRate, int days, BigDecimal discountPercent) {
		BigDecimal gross = dailyRate.multiply(BigDecimal.valueOf(days));
		BigDecimal discount = gross.multiply(discountPercent).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
		return gross.subtract(discount).setScale(2, RoundingMode.HALF_UP);
	}
}