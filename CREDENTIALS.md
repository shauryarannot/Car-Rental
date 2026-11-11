# Ryde.exe – Demo Login Credentials

These accounts are created automatically by the backend on first start
(`AdminInitializer` and `DataSeeder`, with the default in-memory H2 profile).
They are intentionally **not** shown anywhere in the website UI.

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin@carrental.com` | `Admin@123` | Full access to the Admin console (fleet, rentals, categories, coupons, customers). Override with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables. |
| User (Customer) | `customer@carrental.com` | `Customer@123` | Standard customer: browse fleet, book cars, view and return own bookings. |
| User (Employee) | `employee@motherson.com` | `Customer@123` | Customer with an employee ID, eligible for employee coupons. |

New users can also self-register from the **Sign up** tab on the login page (they receive the User role).

> For development/demo use only. Change these credentials and the `JWT_SECRET` before any real deployment.

