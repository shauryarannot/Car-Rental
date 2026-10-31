package com.motherson.carrental.config;

import com.motherson.carrental.entity.Category;
import com.motherson.carrental.entity.Customer;
import com.motherson.carrental.entity.DiscountCoupon;
import com.motherson.carrental.entity.Rental;
import com.motherson.carrental.entity.Vehicle;
import com.motherson.carrental.enums.BenefitType;
import com.motherson.carrental.enums.CouponType;
import com.motherson.carrental.enums.RentalStatus;
import com.motherson.carrental.enums.Role;
import com.motherson.carrental.repository.CategoryRepository;
import com.motherson.carrental.repository.CustomerRepository;
import com.motherson.carrental.repository.DiscountCouponRepository;
import com.motherson.carrental.repository.RentalRepository;
import com.motherson.carrental.repository.VehicleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;

/**
 * Fills the (in-memory) database with realistic sample data on startup.
 * Runs only when the database is empty. Disable with app.seed.enabled=false.
 *
 * The data respects the same rules the services enforce: category discount 0-50,
 * FIRST_RENTAL coupon = 50% and only on a customer's first rental, DURATION coupons
 * only within their day range, EMPLOYEE coupons only for customers with an employeeId,
 * rentals of 1-30 days, rentals never overlap on the same vehicle, and any vehicle
 * with an ACTIVE rental is marked unavailable.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    private static final int HISTORY_DAYS = 365;

    private final CategoryRepository categoryRepository;
    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;
    private final DiscountCouponRepository couponRepository;
    private final RentalRepository rentalRepository;
    private final PasswordEncoder passwordEncoder;

    // Fixed seed so every restart produces the same data set.
    private final Random rnd = new Random(42);

    public DataSeeder(CategoryRepository categoryRepository, VehicleRepository vehicleRepository,
                      CustomerRepository customerRepository, DiscountCouponRepository couponRepository,
                      RentalRepository rentalRepository, PasswordEncoder passwordEncoder) {
        this.categoryRepository = categoryRepository;
        this.vehicleRepository = vehicleRepository;
        this.customerRepository = customerRepository;
        this.couponRepository = couponRepository;
        this.rentalRepository = rentalRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (vehicleRepository.count() > 0) {
            log.info("DataSeeder: database already has data, skipping");
            return;
        }
        Map<String, Category> categories = seedCategories();
        List<Vehicle> vehicles = seedVehicles(categories);
        List<Customer> customers = seedCustomers();
        List<DiscountCoupon> coupons = seedCoupons();
        int rentals = seedRentals(vehicles, customers, coupons);

        log.info("DataSeeder: {} categories, {} vehicles, {} customers, {} coupons, {} rentals",
                categories.size(), vehicles.size(), customers.size(), coupons.size(), rentals);
    }

    // ------------------------------------------------------------------ categories

    private Map<String, Category> seedCategories() {
        Object[][] data = {
                {"Hatchback", 10}, {"Sedan", 5}, {"Compact SUV", 8}, {"SUV", 0},
                {"MUV", 12}, {"Luxury", 0}, {"Electric", 15}, {"Convertible", 0},
        };
        Map<String, Category> map = new HashMap<>();
        for (Object[] row : data) {
            Category c = new Category();
            c.setName((String) row[0]);
            c.setDiscountPercent(BigDecimal.valueOf((Integer) row[1]));
            map.put(c.getName(), categoryRepository.save(c));
        }
        return map;
    }

    // ------------------------------------------------------------------ vehicles

    private List<Vehicle> seedVehicles(Map<String, Category> cats) {
        Object[][] data = {
                // Hatchback
                {"Maruti Swift", 1800, "Hatchback"}, {"Maruti Baleno", 1950, "Hatchback"},
                {"Maruti Wagon R", 1500, "Hatchback"}, {"Maruti Alto K10", 1300, "Hatchback"},
                {"Maruti Celerio", 1400, "Hatchback"}, {"Hyundai i20", 2000, "Hatchback"},
                {"Hyundai Grand i10 Nios", 1700, "Hatchback"}, {"Tata Altroz", 1900, "Hatchback"},
                {"Tata Tiago", 1500, "Hatchback"}, {"Toyota Glanza", 2000, "Hatchback"},
                {"Volkswagen Polo", 2100, "Hatchback"}, {"Renault Kwid", 1250, "Hatchback"},
                // Sedan
                {"Honda City", 3000, "Sedan"}, {"Honda Amaze", 2400, "Sedan"},
                {"Hyundai Verna", 3100, "Sedan"}, {"Hyundai Aura", 2200, "Sedan"},
                {"Maruti Dzire", 2300, "Sedan"}, {"Maruti Ciaz", 2700, "Sedan"},
                {"Skoda Slavia", 3200, "Sedan"}, {"Volkswagen Virtus", 3300, "Sedan"},
                {"Tata Tigor", 2100, "Sedan"}, {"Toyota Camry", 7500, "Sedan"},
                // Compact SUV
                {"Tata Nexon", 2800, "Compact SUV"}, {"Tata Punch", 2200, "Compact SUV"},
                {"Hyundai Venue", 2900, "Compact SUV"}, {"Kia Sonet", 3000, "Compact SUV"},
                {"Maruti Brezza", 2900, "Compact SUV"}, {"Maruti Fronx", 2600, "Compact SUV"},
                {"Mahindra XUV 3XO", 3100, "Compact SUV"}, {"Nissan Magnite", 2400, "Compact SUV"},
                {"Renault Kiger", 2400, "Compact SUV"}, {"Hyundai Exter", 2300, "Compact SUV"},
                // SUV
                {"Hyundai Creta", 3800, "SUV"}, {"Kia Seltos", 3900, "SUV"},
                {"Mahindra XUV700", 4800, "SUV"}, {"Mahindra Scorpio N", 4500, "SUV"},
                {"Mahindra Thar", 4200, "SUV"}, {"Tata Harrier", 4600, "SUV"},
                {"Tata Safari", 5000, "SUV"}, {"Toyota Fortuner", 7000, "SUV"},
                {"MG Hector", 4300, "SUV"}, {"Skoda Kushaq", 3700, "SUV"},
                {"Volkswagen Taigun", 3700, "SUV"}, {"Maruti Grand Vitara", 3900, "SUV"},
                {"Jeep Compass", 5500, "SUV"},
                // MUV
                {"Toyota Innova Crysta", 5200, "MUV"}, {"Toyota Innova Hycross", 5800, "MUV"},
                {"Maruti Ertiga", 2900, "MUV"}, {"Maruti XL6", 3200, "MUV"},
                {"Kia Carens", 3600, "MUV"}, {"Mahindra Marazzo", 3300, "MUV"},
                {"Renault Triber", 2300, "MUV"}, {"Kia Carnival", 8500, "MUV"},
                // Luxury
                {"BMW 3 Series", 9500, "Luxury"}, {"BMW 5 Series", 13000, "Luxury"},
                {"BMW X1", 10000, "Luxury"}, {"BMW X5", 18000, "Luxury"},
                {"Mercedes C-Class", 11000, "Luxury"}, {"Mercedes E-Class", 14500, "Luxury"},
                {"Mercedes GLC", 13500, "Luxury"}, {"Audi A4", 10500, "Luxury"},
                {"Audi A6", 14000, "Luxury"}, {"Audi Q5", 13000, "Luxury"},
                {"Volvo XC60", 12500, "Luxury"}, {"Jaguar XF", 15000, "Luxury"},
                {"Lexus ES", 16000, "Luxury"},
                // Electric
                {"Tata Nexon EV", 3400, "Electric"}, {"Tata Tiago EV", 2300, "Electric"},
                {"Tata Punch EV", 2800, "Electric"}, {"MG ZS EV", 4400, "Electric"},
                {"MG Comet EV", 1800, "Electric"}, {"Mahindra XUV400", 3600, "Electric"},
                {"Hyundai Ioniq 5", 9000, "Electric"}, {"BYD Atto 3", 7500, "Electric"},
                {"Kia EV6", 11000, "Electric"},
                // Convertible
                {"Mini Cooper Convertible", 12000, "Convertible"},
                {"BMW Z4", 19000, "Convertible"},
                {"Mercedes CLE Cabriolet", 22000, "Convertible"},
        };
        List<Vehicle> list = new ArrayList<>();
        for (Object[] row : data) {
            Vehicle v = new Vehicle();
            v.setName((String) row[0]);
            v.setDailyRate(BigDecimal.valueOf((Integer) row[1]));
            v.setCategory(cats.get((String) row[2]));
            v.setAvailable(true);
            list.add(vehicleRepository.save(v));
        }
        return list;
    }

    // ------------------------------------------------------------------ customers

    private List<Customer> seedCustomers() {
        String[] first = {
                "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan",
                "Kabir", "Ananya", "Diya", "Aadhya", "Saanvi", "Pari", "Anika", "Navya", "Ira", "Myra",
                "Priya", "Neha", "Kavya", "Meera", "Riya", "Rahul", "Vikram", "Siddharth", "Karan", "Nikhil",
                "Pooja", "Sneha", "Tanvi", "Aditi", "Shreya", "Harsh", "Manish", "Deepak", "Suresh", "Lakshmi",
        };
        String[] last = {
                "Sharma", "Verma", "Gupta", "Iyer", "Nair", "Reddy", "Patel", "Shah", "Mehta", "Kapoor",
                "Singh", "Kumar", "Rao", "Menon", "Pillai", "Joshi", "Desai", "Chopra", "Malhotra", "Bose",
                "Banerjee", "Mukherjee", "Das", "Sehgal", "Agarwal", "Bhat", "Kulkarni", "Naidu", "Sinha", "Saxena",
        };
        String[] domains = {"gmail.com", "outlook.com", "yahoo.co.in", "rediffmail.com", "proton.me"};

        List<Customer> list = new ArrayList<>();
        Set<String> emails = new HashSet<>();
        String defaultHash = passwordEncoder.encode("Customer@123");

        // Two predictable demo customer accounts (standard + Motherson employee)
        Object[][] demos = {
                {"Aarav Sharma", "customer@carrental.com", "+91 9810010001", null},
                {"Priya Nair", "employee@motherson.com", "+91 9810010002", "MSN10000"},
        };
        for (Object[] d : demos) {
            String em = (String) d[1];
            emails.add(em);
            if (!customerRepository.existsByEmail(em)) {
                Customer demo = new Customer();
                demo.setName((String) d[0]);
                demo.setEmail(em);
                demo.setPhone((String) d[2]);
                demo.setEmployeeId((String) d[3]);
                demo.setPassword(defaultHash);
                demo.setRole(Role.CUSTOMER);
                demo.setActive(true);
                list.add(customerRepository.save(demo));
            }
        }

        int employeeNo = 10001;
        while (list.size() < 180) {
            String f = pick(first);
            String l = pick(last);
            boolean employee = rnd.nextDouble() < 0.25;
            String email = employee
                    ? (f + "." + l).toLowerCase() + "@motherson.com"
                    : (f + "." + l + (rnd.nextInt(90) + 10)).toLowerCase() + "@" + pick(domains);
            if (!emails.add(email) || customerRepository.existsByEmail(email)) continue;

            Customer c = new Customer();
            c.setName(f + " " + l);
            c.setEmail(email);
            c.setPhone("+91 " + (rnd.nextInt(4) + 6) + String.format("%09d", rnd.nextInt(1_000_000_000)));
            c.setEmployeeId(employee ? "MSN" + (employeeNo++) : null);
            c.setPassword(defaultHash);
            c.setRole(Role.CUSTOMER);
            c.setActive(rnd.nextDouble() > 0.05); // ~5% deactivated
            list.add(customerRepository.save(c));
        }
        return list;
    }

    // ------------------------------------------------------------------ coupons

    private List<DiscountCoupon> seedCoupons() {
        List<DiscountCoupon> list = new ArrayList<>();
        list.add(coupon("WELCOME50", CouponType.FIRST_RENTAL, 50, null, null));
        list.add(coupon("WEEKEND10", CouponType.DURATION, 10, 1, 3));
        list.add(coupon("WEEKLONG15", CouponType.DURATION, 15, 5, 9));
        list.add(coupon("FORTNIGHT20", CouponType.DURATION, 20, 10, 16));
        list.add(coupon("LONGHAUL25", CouponType.DURATION, 25, 17, 30));
        list.add(coupon("MOTHERSON20", CouponType.EMPLOYEE, 20, null, null));
        list.add(coupon("STAFF30", CouponType.EMPLOYEE, 30, null, null));
        return list;
    }

    private DiscountCoupon coupon(String code, CouponType type, int pct, Integer min, Integer max) {
        DiscountCoupon c = new DiscountCoupon();
        c.setCode(code);
        c.setCouponType(type);
        c.setDiscountPercent(BigDecimal.valueOf(pct));
        c.setMinDays(min);
        c.setMaxDays(max);
        return couponRepository.save(c);
    }

    // ------------------------------------------------------------------ rentals

    /** A rental slot on one vehicle's timeline, before a customer is assigned. */
    private record Slot(Vehicle vehicle, LocalDate start, int days, boolean active) { }

    private int seedRentals(List<Vehicle> vehicles, List<Customer> customers, List<DiscountCoupon> coupons) {
        LocalDate today = LocalDate.now();
        List<Slot> slots = new ArrayList<>();

        for (Vehicle v : vehicles) {
            // ~25% of the fleet is currently out on an ACTIVE rental.
            LocalDate cursor = today;
            if (rnd.nextDouble() < 0.25) {
                int startedAgo = rnd.nextInt(6);                 // started 0-5 days ago
                int days = startedAgo + 1 + rnd.nextInt(10);     // still running today
                LocalDate start = today.minusDays(startedAgo);
                slots.add(new Slot(v, start, days, true));
                cursor = start;
            }
            // Walk backwards building non-overlapping completed rentals.
            // Pricier cars rent less often.
            int maxGap = v.getDailyRate().intValue() > 9000 ? 25 : 10;
            cursor = cursor.minusDays(1 + rnd.nextInt(4));
            while (true) {
                int days = randomDays();
                LocalDate start = cursor.minusDays(days);
                if (start.isBefore(today.minusDays(HISTORY_DAYS))) break;
                slots.add(new Slot(v, start, days, false));
                cursor = start.minusDays(rnd.nextInt(maxGap + 1));
            }
        }

        // Assign customers in chronological order so FIRST_RENTAL logic is correct.
        slots.sort(Comparator.comparing(Slot::start));
        List<Customer> activeCustomers = customers.stream().filter(Customer::isActive).toList();
        Set<Long> hasRented = new HashSet<>();
        Map<CouponType, List<DiscountCoupon>> byType = new HashMap<>();
        for (DiscountCoupon c : coupons) byType.computeIfAbsent(c.getCouponType(), k -> new ArrayList<>()).add(c);

        List<Rental> rentals = new ArrayList<>();
        for (Slot s : slots) {
            // Deactivated customers may appear in old history, but never on an active rental.
            Customer customer = s.active() || rnd.nextDouble() < 0.9 ? pick(activeCustomers) : pick(customers);
            boolean first = hasRented.add(customer.getId());

            Rental r = new Rental();
            r.setCustomer(customer);
            r.setVehicle(s.vehicle());
            r.setDays(s.days());
            r.setStartDate(s.start());
            r.setEndDate(s.start().plusDays(s.days()));
            r.setStatus(s.active() ? RentalStatus.ACTIVE : RentalStatus.COMPLETED);
            applyBenefit(r, customer, first, byType);
            rentals.add(r);

            if (s.active()) s.vehicle().setAvailable(false);
        }
        rentalRepository.saveAll(rentals);
        vehicleRepository.saveAll(vehicles);
        return rentals.size();
    }

    private void applyBenefit(Rental r, Customer customer, boolean firstRental,
                              Map<CouponType, List<DiscountCoupon>> coupons) {
        BigDecimal rate = r.getVehicle().getDailyRate();
        BigDecimal categoryPct = r.getVehicle().getCategory().getDiscountPercent();
        double roll = rnd.nextDouble();

        BenefitType type = BenefitType.NONE;
        BigDecimal pct = BigDecimal.ZERO;
        String code = null;

        if (firstRental && roll < 0.6) {
            DiscountCoupon c = coupons.get(CouponType.FIRST_RENTAL).get(0);
            type = BenefitType.COUPON; pct = c.getDiscountPercent(); code = c.getCode();
        } else if (customer.getEmployeeId() != null && roll < 0.5) {
            DiscountCoupon c = pick(coupons.get(CouponType.EMPLOYEE));
            type = BenefitType.COUPON; pct = c.getDiscountPercent(); code = c.getCode();
        } else if (roll < 0.25) {
            DiscountCoupon match = coupons.get(CouponType.DURATION).stream()
                    .filter(c -> r.getDays() >= c.getMinDays() && r.getDays() <= c.getMaxDays())
                    .findFirst().orElse(null);
            if (match != null) {
                type = BenefitType.COUPON; pct = match.getDiscountPercent(); code = match.getCode();
            }
        } else if (roll < 0.4 && categoryPct.signum() > 0) {
            type = BenefitType.CATEGORY_DISCOUNT; pct = categoryPct;
        }
        // FREE_UPGRADE is skipped in seed data: it swaps the vehicle and would break
        // the non-overlapping timeline per vehicle.

        r.setBenefitType(type);
        r.setCouponCode(code);
        r.setDiscountPercent(pct);
        r.setTotalAmount(total(rate, r.getDays(), pct));
    }

    /** Same formula as RentalService.calculateTotal. */
    private BigDecimal total(BigDecimal rate, int days, BigDecimal pct) {
        BigDecimal gross = rate.multiply(BigDecimal.valueOf(days));
        BigDecimal discount = gross.multiply(pct).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return gross.subtract(discount).setScale(2, RoundingMode.HALF_UP);
    }

    /** Mostly short trips, some weeks, a few long hauls. Always 1-30. */
    private int randomDays() {
        double r = rnd.nextDouble();
        if (r < 0.55) return 1 + rnd.nextInt(3);
        if (r < 0.85) return 4 + rnd.nextInt(6);
        if (r < 0.97) return 10 + rnd.nextInt(7);
        return 17 + rnd.nextInt(14);
    }

    private <T> T pick(T[] arr) { return arr[rnd.nextInt(arr.length)]; }
    private <T> T pick(List<T> list) { return list.get(rnd.nextInt(list.size())); }
}

