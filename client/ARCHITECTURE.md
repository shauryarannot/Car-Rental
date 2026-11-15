# Ryde.exe — Frontend Architecture, Data Flow & File Guide

This document explains the complete architecture of the `client/` React application, how data flows between the Spring Boot backend and the frontend, how hooks and state management work, where exceptions and errors are handled at every layer, and what every file in the `client/` folder does.

---

## 1. High-Level Architecture & Tech Stack

The frontend is a Single-Page Application (SPA) written in modern **JavaScript (`.js` / `.jsx`)**:

- **UI Framework:** React 19 (`react`, `react-dom`)
- **Build Tool & Dev Server:** Vite 8 (`vite`, `@vitejs/plugin-react`)
- **Routing:** React Router v7 (`react-router-dom`) with route-level code splitting (`React.lazy` + `Suspense`)
- **Server State & Caching:** TanStack React Query v5 (`@tanstack/react-query`)
- **Styling:** Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`) + custom CSS design tokens (`tokens.css`, `global.css`)
- **Animations & Smooth Scrolling:** Motion (`motion/react`) + Lenis (`lenis`)
- **Notifications:** Sonner (`sonner`)

### Layered Architecture

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ Pages & UI Components (src/pages/*, src/components/*)                   │
│   Renders UI, reads URL params, triggers queries & mutations            │
├─────────────────────────────────────────────────────────────────────────┤
│ React Contexts & Custom Hooks (src/app/auth.jsx, theme.jsx, queries.js) │
│   Manages JWT session, Light/Dark theme, and React Query cache keys     │
├─────────────────────────────────────────────────────────────────────────┤
│ API Client Layer (src/api/index.js)                                     │
│   Maps domain actions (listCars, createBooking, login) to REST paths    │
├─────────────────────────────────────────────────────────────────────────┤
│ HTTP Transport & Error Normalizer (src/api/http.js)                     │
│   Attaches Bearer JWT, parses JSON errors, dispatches 401 expiry events │
├─────────────────────────────────────────────────────────────────────────┤
│ Spring Boot Backend (/api/* on port 8080)                               │
│   Controllers → Services → Repositories + GlobalExceptionHandler        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. End-to-End Data Flow (Backend ↔ Frontend)

### 2.1 How a Read Request Flows (GET)
Example: Loading the vehicle fleet on `Home.jsx` or `Fleet.jsx`:

1. **Component Mounts:** `Home.jsx` or `Fleet.jsx` calls the custom hook `useCars()` from `src/hooks/queries.js`.
2. **React Query Cache Check:** `useQuery({ queryKey: ['cars', filter], queryFn: () => api.listCars(filter) })` checks if fresh data already exists in memory (cached for `staleTime: 30_000` ms).
3. **API Client Call:** If not cached or stale, `api.listCars()` in `src/api/index.js` selects the backend path (`/api/vehicles`, `/api/vehicles/available`, `/api/vehicles/category/{id}`, or `/api/vehicles/search?name=...`) and calls `http(path)`.
4. **HTTP Transport (`src/api/http.js`):**
   - Reads the active JWT from `getAuthToken()` (`src/app/auth.jsx`).
   - Attaches `Authorization: Bearer <token>` if signed in.
   - Sends `fetch('/api/vehicles')` (in development, Vite proxies `/api` to `http://localhost:8080/api`).
5. **Backend Processing:**
   - Spring Boot `VehicleController.getAll()` → `VehicleService` → `VehicleRepository` fetches `Vehicle` entities from the database and serializes them as JSON.
6. **Frontend Model Adaptation (`vehicleToCar`):**
   - `src/api/http.js` runs `vehicleToCar(v)` on each backend `Vehicle` object:
     - Splits `v.name` (e.g., `"BMW 3 Series"`) into `make: "BMW"` and `model: "3 Series"`.
     - Converts `v.dailyRate` to a numeric `pricePerDay`.
     - Looks up the local vehicle photograph path via `carImage(v.name)` (`src/lib/carImages.js` → `src/data/carImages.json`).
7. **Reactive UI Render:** React Query stores the adapted `Car[]` array under `['cars']` and triggers a re-render of `Home.jsx` / `Fleet.jsx`.

---

### 2.2 How a Write Request Flows (POST / PUT / DELETE)
Example: Reserving a car in `CarDetail.jsx`:

1. **User Action:** Customer selects a **Pick-up date** (`startDate`), **Return date** / **Duration** (`days`), and an **Offer** (`benefit` / `couponCode`), then submits the booking form.
2. **Mutation Trigger:** `CarDetail.jsx` calls `book.mutate()` (a `useMutation` hook from `@tanstack/react-query`).
3. **API Request (`api.createBooking` in `src/api/index.js`):**
   - Computes `days = daysBetween(req.startDate, req.endDate)`.
   - Builds query parameters: `POST /api/rentals?vehicleId=5&days=3&startDate=2026-11-20&benefit=COUPON&couponCode=WELCOME50`.
   - Calls `http()` which attaches `Authorization: Bearer <jwt>`.
4. **Backend Validation & Execution:**
   - `RentalController.rent()` extracts the customer email from the JWT `Authentication` principal and calls `RentalService.rent(...)`.
   - `RentalService` validates the date window (`1–30` days, pick-up date between today and `+30` days), checks vehicle availability, applies category/coupon/free-upgrade rules, saves the `Rental`, marks the vehicle unavailable, and returns `201 Created` with the `Rental` JSON.
5. **Cache Invalidation & Navigation (`onSuccess`):**
   - `CarDetail.jsx` invalidates `['cars']`, `['car']`, and `['my-bookings']` in React Query so the fleet and booking lists immediately reflect the new reservation.
   - Displays a success toast (`toast.success(...)`) and navigates to the digital boarding-pass ticket at `/bookings/${rental.id}` (`Ticket.jsx`).

---

### 2.3 Complete Backend-to-Frontend API Mapping

| Frontend Method (`src/api/index.js`) | HTTP Method & Path | Backend Controller | Access Role |
| :--- | :--- | :--- | :--- |
| `api.login(req)` | `POST /api/auth/login` | `AuthController.login` | Public |
| `api.register(req)` | `POST /api/auth/register` | `AuthController.register` | Public |
| `api.listCars(filter)` | `GET /api/vehicles` (+ `/available`, `/category/{id}`, `/search`) | `VehicleController` | Public / Auth |
| `api.getCar(id)` | `GET /api/vehicles/{id}` | `VehicleController.getById` | Public / Auth |
| `api.listCategories()` | `GET /api/categories` | `CategoryController.getAll` | Public / Auth |
| `api.listCoupons()` | `GET /api/coupons` | `DiscountCouponController.getAll` | Public / Auth |
| `api.createBooking(req)` | `POST /api/rentals?vehicleId=&days=&startDate=&benefit=&couponCode=` | `RentalController.rent` | `CUSTOMER` |
| `api.myBookings()` | `GET /api/rentals/my` | `RentalController.getMine` | `CUSTOMER` |
| `api.getBooking(id)` | `GET /api/rentals/{id}` | `RentalController.getById` | Owner or `ADMIN` |
| `api.cancelBooking(id)` | `PUT /api/rentals/{id}/return` | `RentalController.returnVehicle` | Owner or `ADMIN` |
| `api.listBookings()` | `GET /api/rentals` | `RentalController.getAll` | `ADMIN` |
| `api.customerBookings(id)` | `GET /api/rentals/customer/{id}` | `RentalController.getHistory` | `ADMIN` |
| `api.createVehicle(payload)` | `POST /api/vehicles` | `VehicleController.create` | `ADMIN` |
| `api.updateVehicle(id, payload)` | `PUT /api/vehicles/{id}` | `VehicleController.update` | `ADMIN` |
| `api.deleteVehicle(id)` | `DELETE /api/vehicles/{id}` | `VehicleController.delete` | `ADMIN` |
| `api.createCategory(payload)` | `POST /api/categories` | `CategoryController.create` | `ADMIN` |
| `api.updateCategory(id, payload)` | `PUT /api/categories/{id}` | `CategoryController.update` | `ADMIN` |
| `api.deleteCategory(id)` | `DELETE /api/categories/{id}` | `CategoryController.delete` | `ADMIN` |
| `api.createCoupon(payload)` | `POST /api/coupons` | `DiscountCouponController.create` | `ADMIN` |
| `api.updateCoupon(id, payload)` | `PUT /api/coupons/{id}` | `DiscountCouponController.update` | `ADMIN` |
| `api.deleteCoupon(id)` | `DELETE /api/coupons/{id}` | `DiscountCouponController.delete` | `ADMIN` |
| `api.listCustomers()` | `GET /api/customers` | `CustomerController.getAll` | `ADMIN` |
| `api.createCustomer(payload)` | `POST /api/customers` | `CustomerController.create` | `ADMIN` |
| `api.updateCustomer(id, payload)` | `PUT /api/customers/{id}` | `CustomerController.update` | `ADMIN` |
| `api.deactivateCustomer(id)` | `DELETE /api/customers/{id}` | `CustomerController.deactivate` | `ADMIN` |

---

## 3. Exception & Error Handling Architecture

Exceptions are handled through a **4-stage pipeline** from Spring Boot down to the React UI.

### Stage 1: Backend Exception Translation (`GlobalExceptionHandler.java`)
In the Spring Boot backend (`com.motherson.carrental.exception.GlobalExceptionHandler`), `@RestControllerAdvice` intercepts Java exceptions and converts them into structured JSON `{ "error": "<message>" }`:

- `IllegalArgumentException` → **HTTP 400 Bad Request** (e.g., `"Pick-up date cannot be in the past"`, `"Coupon is only valid for first rental"`, `"Vehicle is not available"`, `"Employee ID is required for employee coupon"`).
- `VehicleNotFoundException` / `CategoryNotFoundException` / `CustomerNotFoundException` / `DiscountCouponNotFoundException` / `RentalNotFoundException` → **HTTP 404 Not Found**.
- `AccessDeniedException` → **HTTP 403 Forbidden** (e.g., `"Admin only"`).
- `ResponseStatusException` (thrown in `AuthService` / `CustomerService`) → **HTTP 401 Unauthorized** or **HTTP 409 Conflict** (e.g., `"Email already registered"`).

### Stage 2: Frontend HTTP Interceptor & Normalizer (`src/api/http.js`)
Every single `fetch()` call in the frontend goes through `http(path, init)` in `src/api/http.js`. No component calls `fetch` directly.

1. **Network / Offline Failure (`catch` around `fetch`):**
   - If the Spring Boot server is stopped or unreachable, `fetch()` throws a `TypeError`.
   - `http.js` catches it and throws a normalized error object:
     ```js
     { status: 0, message: 'The garage is closed. Try again.', unreachable: true }
     ```
2. **Non-2xx HTTP Status (`!res.ok`):**
   - Sets a sensible default message for `401` (`"Invalid email or password, or your session expired."`), `403` (`"You do not have permission for this action."`), or `Request failed (${res.status})`.
   - Parses the JSON response body (`await res.json()`) and extracts `body.error` (from `GlobalExceptionHandler`) or `body.message` so the exact backend validation reason is preserved.
   - **Automatic Session Expiry Handling (`401`):**
     - If `res.status === 401` on any non-auth endpoint (`!path.startsWith('/api/auth/')`), `http.js` dispatches a global browser event:
       ```js
       window.dispatchEvent(new Event('odo:unauthorized'))
       ```
     - `AuthProvider` (`src/app/auth.jsx`) listens for `'odo:unauthorized'` and automatically clears `localStorage` and resets `user` state, which redirects protected routes to `/login`.
   - Throws the normalized error object:
     ```js
     { status: res.status, message, unreachable: res.status >= 502 }
     ```
3. **Error Type Guard (`isApiError(e)`):**
   - Exported from `src/api/http.js` (and re-exported by `src/api/index.js`) to verify whether a caught error is a normalized API error object (`{ status, message }`).

### Stage 3: React Query Retry & Optimistic Rollback
- **Smart Retry Policy (`src/app/App.jsx`):**
  ```js
  retry: (count, err) => isApiError(err) && err.unreachable && count < 1
  ```
  React Query only retries once if the server was unreachable (`status: 0` or `>= 502`). It **never** retries `400`, `401`, `403`, or `404` business errors.
- **Optimistic UI Rollback (`src/pages/MyBookings.jsx`):**
  - When a customer clicks **"Return car"**, `onMutate` optimistically marks the rental as `'COMPLETED'` in the UI immediately.
  - If the backend returns an error, `onError` restores the previous query snapshot (`qc.setQueryData(key, ctx?.prev)`) and shows an error toast.

### Stage 4: Component-Level Error Presentation
- **Client-Side Form Validation (`Login.jsx`, `Signup.jsx`):**
  - Validates email regex (`EMAIL_RE`), full name length (`>= 2`), and password length (`>= 6`) before sending network requests, passing field-level error strings into `<Input error={...} />` (`src/components/ui/input.jsx`).
- **Mutation Error Toasts (`sonner`) & Inline Alerts:**
  - `Login.jsx` & `Signup.jsx`: Show both a `toast.error(e.message)` and an inline `<p role="alert">` banner with the server error message.
  - `CarDetail.jsx`, `MyBookings.jsx`, `Admin.jsx`: Use `onError: (e) => toast.error(isApiError(e) ? e.message : fallback)` so backend business rules (e.g., invalid coupon days, deleting a category that still has vehicles, or deleting a car with rental history) appear immediately as toast notifications.
- **Query Error & 404 States:**
  - `CarDetail.jsx` & `Ticket.jsx`: Check `isApiError(error) && error.status === 404` to distinguish between `"Wrong turn."` (404 missing ID) and `"The garage is closed."` (server unreachable).
  - `Home.jsx`, `Fleet.jsx`, `MyBookings.jsx`: Render a `<div role="alert">` fallback card with a **Retry** button (`refetch()`) when the backend is offline, while `Home.jsx` also provides static fallback categories, featured vehicles, and coupons so the landing page remains browsable even if the backend isn't running yet.

---

## 4. Hooks & State Management

### 4.1 Custom React Query Hooks (`src/hooks/queries.js`)
| Hook | Query Key | API Call | Where Used |
| :--- | :--- | :--- | :--- |
| `useCars(filter)` | `['cars', filter ?? {}]` | `api.listCars(filter)` | `Home.jsx`, `Fleet.jsx`, `CarDetail.jsx`, `Admin.jsx` |
| `useCar(id)` | `['car', id]` | `api.getCar(id)` | `CarDetail.jsx` |
| `useCategories()` | `['categories']` | `api.listCategories()` | `Home.jsx`, `Fleet.jsx`, `CarDetail.jsx`, `Admin.jsx` |
| `useCoupons()` | `['coupons']` | `api.listCoupons()` | `Home.jsx`, `CarDetail.jsx`, `Admin.jsx` |
| `useCustomers()` | `['customers']` | `api.listCustomers()` | `Admin.jsx` |
| `useAllBookings()` | `['all-bookings']` | `api.listBookings()` | `Admin.jsx` |

Additional page-specific queries:
- `['my-bookings', user?.email]` in `MyBookings.jsx` → calls `api.myBookings()` (enabled only for authenticated `CUSTOMER` accounts).
- `['booking', Number(id)]` in `Ticket.jsx` → calls `api.getBooking(Number(id))`.
- `['customer-history', historyCustomer?.id]` in `Admin.jsx` → calls `api.customerBookings(id)` when inspecting a customer's rental history slide-over.

### 4.2 Authentication Context Hook (`useAuth` in `src/app/auth.jsx`)
- Persists `{ token, name, email, role, employeeId }` in `localStorage` under `'odo-auth'` and syncs across browser tabs via the `storage` event.
- Exposes:
  - `user`: Current user object or `null`
  - `isAdmin`: `user?.role === 'ADMIN'`
  - `isCustomer`: `user?.role === 'CUSTOMER'`
  - `isEmployee`: `true` if `user.email` ends with `@motherson.com` or `user.employeeId` is present (used by `Navbar.jsx` to display the `"Motherson"` badge)
  - `login(res, email, employeeId)`: Saves the JWT session after `/api/auth/login`
  - `logout()`: Clears `localStorage` and resets auth state

### 4.3 Theme Context Hook (`useTheme` in `src/app/theme.jsx`)
- Persists `'light'` or `'dark'` in `localStorage` under `'odo-theme'` (defaults to OS `prefers-color-scheme`).
- Toggles the `.dark` class on `document.documentElement` (`<html>`) and updates `<meta name="theme-color">`.
- Consumed by the **Theme** dropdown (`Light` / `Dark`) in `Navbar.jsx` and `<Toaster theme={theme} />` in `App.jsx`.

### 4.4 URL Search Params State (`useSearchParams`)
- `Fleet.jsx` stores all active filters in the URL query string (`?start=YYYY-MM-DD&days=2&category=1&available=false&max=10000&sort=price-asc&q=bmw`) so filtered views are shareable and preserved on browser back/forward navigation.
- Clicking a `CarCard` forwards `?days=...&start=...` to `/fleet/:id` (`CarDetail.jsx`), which initializes its booking form from those URL parameters.

---

## 5. File-by-File Guide (`client/`)

### Root Configuration Files
- **`index.html`**: HTML shell loading `/favicon_ryd.png` and mounting `/src/main.jsx` into `#root`.
- **`package.json`**: Scripts (`dev`, `build`, `lint`, `preview`) and runtime/dev dependencies.
- **`vite.config.js`**: Vite configuration with `@vitejs/plugin-react`, `@tailwindcss/vite`, `@` path alias (`./src`), and dev proxy forwarding `/api` to `http://localhost:8080`.
- **`jsconfig.json`**: IDE module resolution config mapping `@/*` to `./src/*`.
- **`.oxlintrc.json`**: Linter configuration for React and Oxc rules.
- **`.env` / `.env.example`**: Environment variable `VITE_API_URL=` (empty in dev to use Vite's `/api` proxy, or set to the backend origin in production).

### Application Core (`src/main.jsx` & `src/app/`)
- **`src/main.jsx`**: Application entry point. Imports self-hosted fonts (`Archivo`, `Instrument Serif`, `JetBrains Mono`), global CSS (`src/styles/global.css`), and mounts `<App />`.
- **`src/app/App.jsx`**: Configures `QueryClient`, wraps the app in `ThemeProvider`, `AuthProvider`, and `BrowserRouter`, defines `RequireAuth` for protected routes, and sets up lazy-loaded routes:
  - Public: `/` (`Home`), `/login` (`Login`), `/signup` (`Signup`), `*` (`NotFound`)
  - Protected (`RequireAuth`): `/fleet` (`Fleet`), `/fleet/:id` (`CarDetail`), `/bookings` (`MyBookings`), `/bookings/:id` (`Ticket`), `/admin` (`Admin`)
- **`src/app/auth.jsx`**: `AuthProvider`, `useAuth()` hook, `getAuthToken()` helper for `http.js`, cross-tab storage sync, and `odo:unauthorized` listener.
- **`src/app/theme.jsx`**: `ThemeProvider` and `useTheme()` hook for switching between Light (`#FAF6F0` warm paper) and Dark (`#0B0D10` night-drive) modes.

### API Layer (`src/api/`)
- **`src/api/http.js`**: Central `http()` fetch wrapper, JWT header injection, JSON error extraction, 401 event dispatching, `isApiError()` helper, and `vehicleToCar()` adapter.
- **`src/api/index.js`**: Exports `api` object containing all REST methods for authentication, browsing, customer rentals, and admin CRUD operations.

### Hooks & Utilities (`src/hooks/`, `src/lib/`, `src/data/`)
- **`src/hooks/queries.js`**: Shared TanStack Query hooks (`useCars`, `useCar`, `useCategories`, `useCoupons`, `useCustomers`, `useAllBookings`).
- **`src/lib/trip.js`**: Date math and validation utilities (`MAX_DAYS = 30`, `MAX_ADVANCE_DAYS = 30`, `today()`, `addDays()`, `maxStartDate()`, `clampStartDate()`, `returnDateFor()`, `daysBetween()`, `daysUntil()`, `clampDays()`, `prettyDate()`).
- **`src/lib/utils.js`**: `cn()` (Tailwind class merger using `clsx` + `tailwind-merge`), `formatINR()` (`en-IN` currency formatter `₹1,23,456`), and `bookingRef()` (formats booking IDs like `Ryde.exe-2026-0042`).
- **`src/lib/carImages.js`** & **`src/data/carImages.json`**: Maps vehicle names (e.g. `"Honda City"`) to local image assets in `public/cars/`.
- **`src/lib/location.js`**: Pick-up & drop-off branch constants for **Motherson Hub — Sector 2, Noida** (`BRANCH`, `BRANCH_DIRECTIONS`, `BRANCH_MAP_EMBED`).

### Layout & UI Components (`src/components/`)
- **`src/components/layout/Shell.jsx`**: Master layout wrapper rendering the skip-to-content link, `<Navbar />`, `<main>` (`<Outlet />` keyed by auth token so state never leaks across sessions), `<Footer />`, and `<Grain />` inside `<SmoothScroll>`.
- **`src/components/layout/Navbar.jsx`**: Fixed top navigation bar with scroll-progress hairline, role-aware links (`Fleet`, `My bookings`, `Admin console`), **Theme** dropdown (`Light` / `Dark`), user/Motherson badge, Sign in / Sign out actions, and responsive mobile drawer.
- **`src/components/layout/Footer.jsx`**: Footer with role-aware quick links, office address, and responsive full-width `Ryde.exe` wordmark.
- **`src/components/car/CarCard.jsx`**: Vehicle listing card displaying photo (`CarImage`), category badge, discount tag, make/model, daily rate, multi-day total estimate, and availability status. Also exports `CarCardSkeleton`.
- **`src/components/car/CarImage.jsx`**: Renders the vehicle photo with lazy loading and an inline SVG category silhouette fallback if a vehicle has no photo or fails to load.
- **`src/components/car/PickupLocation.jsx`**: Split card displaying the Sector 2, Noida branch details, operating hours, directions link, and embedded Google Map.
- **`src/components/fx/Counter.jsx`**: Rolling mechanical odometer number component with Indian (`en-IN`) digit grouping, aligned prefix (`₹`), and suffix (`Cars`, `/ day`, etc.).
- **`src/components/fx/SmoothScroll.jsx`**: Integrates Lenis smooth scrolling and scrolls to the top on route changes.
- **`src/components/fx/Grain.jsx`**: Subtle fixed SVG film-grain overlay.
- **`src/components/ui/button.jsx`**: Reusable button component supporting `primary`, `secondary`, and `ghost` variants, optional animated `arrow`, and `asChild` link rendering.
- **`src/components/ui/input.jsx`**: Form input with uppercase monospace label, focus styling, and inline validation error message (`role="alert"`).
- **`src/components/ui/section-header.jsx`**: Numbered section header (`01 / ...`) with horizontal rule.
- **`src/components/ui/skeleton.jsx`**: Animated loading placeholder block.
- **`src/components/ui/status-pill.jsx`**: Status badge for `Available`, `Reserved`, and `Out`.

### Pages (`src/pages/`)
- **`src/pages/Home.jsx`**: Public landing page with video hero, interactive `SearchBar` (Pick-up date, Duration, Return date, Category), Motherson Employee Benefits promotional banner (`MOTHERSON20`, `STAFF30`), category grid, featured vehicles, 4-step booking guide, Sector 2 Noida location map, and general discount coupons.
- **`src/pages/Fleet.jsx`**: Full fleet catalog with URL-synced top filter bar (Pick-up date, Duration, Return date, Category, Sort, Search) and sidebar/mobile-sheet filters (Category chips, Max price/day slider, Available-only toggle).
- **`src/pages/CarDetail.jsx`**: Vehicle detail page. Shows vehicle specs and photo on the left; on the right, renders either the **Customer Booking & Receipt Panel** (Pick-up date, Return date, Duration, Offer selector, live price breakdown) or the **Admin Quick-Edit Panel** (`AdminVehicleQuickEdit`) when signed in as `ADMIN`.
- **`src/pages/Login.jsx`**: Dedicated customer/admin Sign In page with validation and link to `/signup`.
- **`src/pages/Signup.jsx`**: Dedicated customer Registration page (Name, Email, Password, Phone, optional Motherson Employee ID) that registers and automatically signs the user in.
- **`src/pages/MyBookings.jsx`**: Customer booking management page with `Active` and `Past` tabs, ticket links, and optimistic **"Return car"** confirmation dialog.
- **`src/pages/Ticket.jsx`**: Printable boarding-pass style booking confirmation page with deterministic barcode, pick-up/drop-off directions, **"Print or save PDF"** (`window.print()`), and **"Add to calendar"** (`.ics` file download).
- **`src/pages/Admin.jsx`**: Role-gated (`ADMIN`) Fleet & Operations console featuring the 5 Night-Drive KPI odometer cards (`Cumulative Revenue`, `Active on the Road`, `Available on the Lot`, `Active Customers`, `Active Coupons`) and 5 management tabs (`Fleet Vehicles`, `Rentals & Timeline`, `Categories`, `Coupons`, `Customers`) with reusable `DataTable` and `FormSlideOver` drawers.
- **`src/pages/NotFound.jsx`**: `404` catch-all route with odometer counter and link back to `/`.

### Styles (`src/styles/`)
- **`src/styles/tokens.css`**: CSS custom properties for Light mode, Dark mode, and the `.night-drive` Admin KPI band (`--odo-bg`, `--odo-text`, `--odo-signal`, `--odo-amber`, etc.), plus font stacks and easing curves.
- **`src/styles/global.css`**: Tailwind v4 `@theme` bindings, base reset, `.page-shell` fluid responsive container (`max-width: 1920px`, `padding-inline: clamp(1rem, 3.5vw, 4rem)`), typography classes (`.wordmark`, `.display-xl`, `.display-condensed`, `.serif-italic`, `.mono`, `.mono-label`), corner registration marks (`.ticks`), and `@media print` rules.

---

## 6. Deep-Dive: Important Code Explained (File-by-File)

Below is a file-by-file breakdown of the most important code blocks in the frontend, showing the actual code and explaining how it works under the hood.

---

### 6.1 `src/api/http.js` — Central HTTP Client, Error Normalizer & Data Adapter

```js
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function http(path, init) {
  const token = getAuthToken()
  const headers = {
    'Content-Type': 'application/json',
    ...init?.headers,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE}${path}`, { ...init, headers })
  } catch {
    throw { status: 0, message: 'The garage is closed. Try again.', unreachable: true }
  }

  if (!res.ok) {
    let message =
      res.status === 401
        ? 'Invalid email or password, or your session expired.'
        : res.status === 403
          ? 'You do not have permission for this action.'
          : `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (body?.error) message = String(body.error)
      else if (body?.message) message = String(body.message)
    } catch {
      /* non-JSON error body */
    }
    if (res.status === 401 && !path.startsWith('/api/auth/')) {
      window.dispatchEvent(new Event('odo:unauthorized'))
    }
    throw { status: res.status, message, unreachable: res.status >= 502 }
  }

  if (res.status === 204) return undefined
  return res.json()
}
```

**What this code does:**
1. **Automatic JWT Injection:** Every request automatically calls `getAuthToken()` and sets `Authorization: Bearer <token>` if the user is logged in. Individual pages never have to pass tokens manually.
2. **Offline Detection (`try / catch` around `fetch`):** Browser `fetch()` only throws an exception when the network or server is completely unreachable (e.g., Spring Boot is stopped). Catching it converts a raw `TypeError` into `{ status: 0, message: 'The garage is closed. Try again.', unreachable: true }`.
3. **Backend Exception Extraction:** When Spring Boot's `GlobalExceptionHandler` returns `400`, `403`, or `404` with `{ "error": "Coupon is only valid for first rental" }`, `body.error` replaces the generic status message so the user sees the exact reason from the backend.
4. **Global 401 Session Expiry (`odo:unauthorized`):** If a user's JWT expires while they are browsing, any protected API call will return `401`. Instead of failing silently, `http.js` fires a custom window event `'odo:unauthorized'` (except on `/api/auth/login` where `401` just means wrong password), which `AuthProvider` catches to log the user out cleanly.

```js
export function vehicleToCar(v) {
  const [make, ...rest] = v.name.trim().split(/\s+/)
  return {
    id: v.id,
    make,
    model: rest.join(' ') || make,
    name: v.name,
    pricePerDay: Number(v.dailyRate),
    available: v.available,
    category: v.category,
    imageUrl: carImage(v.name),
  }
}
```
**What `vehicleToCar` does:**
- The backend `Vehicle` entity stores a single `name` field (e.g., `"Mercedes E-Class"`) and `dailyRate` (`BigDecimal`), and has no image column in the database.
- `vehicleToCar` splits `name` into `make` (`"Mercedes"`) and `model` (`"E-Class"`), converts `dailyRate` into a JavaScript `Number`, and attaches the local image path from `src/data/carImages.json`.

---

### 7.2 `src/api/index.js` — Domain API Methods & Booking Query Builder

```js
  async listCars(f = {}) {
    const path = f.search
      ? `/api/vehicles/search?name=${encodeURIComponent(f.search)}`
      : f.categoryId
        ? `/api/vehicles/category/${f.categoryId}`
        : f.available
          ? '/api/vehicles/available'
          : '/api/vehicles'
    const list = (await http(path)).map(vehicleToCar)
    return list.filter((c) => (!f.available || c.available) && (!f.categoryId || c.category.id === f.categoryId))
  },

  async createBooking(req) {
    const days = daysBetween(req.startDate, req.endDate)
    if (days < 1) throw { status: 400, message: 'Return date must be after pick-up.', unreachable: false }

    const q = new URLSearchParams({ vehicleId: String(req.vehicleId), days: String(days) })
    if (req.startDate) q.set('startDate', req.startDate)
    if (req.benefit && req.benefit !== 'NONE') q.set('benefit', req.benefit)
    if (req.couponCode) q.set('couponCode', req.couponCode)
    return http(`/api/rentals?${q}`, { method: 'POST' })
  },
```

**What this code does:**
- **`listCars(f)`:** Chooses the most specific Spring Boot endpoint (`/search`, `/category/{id}`, `/available`, or `/api/vehicles`), maps every raw vehicle through `vehicleToCar`, and applies client-side intersection filtering if multiple filters were passed.
- **`createBooking(req)`:** Calculates the exact number of rental days from `startDate` and `endDate`, guards against invalid date ranges (`days < 1`), and constructs the URL query string expected by Spring Boot's `RentalController.rent(@RequestParam Long vehicleId, @RequestParam int days, @RequestParam BenefitType benefit, @RequestParam String couponCode, @RequestParam LocalDate startDate)`.

---

### 7.3 `src/app/auth.jsx` — JWT Session Context & Motherson Employee Detection

```jsx
  const login = useCallback((res, email, employeeId) => {
    const cleanEmpId = employeeId?.trim()
    const next = {
      token: res.token,
      name: res.name,
      role: res.role,
      email,
      ...(cleanEmpId ? { employeeId: cleanEmpId } : {}),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next)
  }, [])

  const isEmployee = Boolean(
    user &&
      user.role === 'CUSTOMER' &&
      (user.employeeId || user.email?.toLowerCase().endsWith('@motherson.com')),
  )
```

**What this code does:**
- Saves the authenticated user's JWT `token`, `name`, `role` (`ADMIN` or `CUSTOMER`), `email`, and optional `employeeId` in `localStorage` under `'odo-auth'`.
- Computes `isEmployee`: if a customer registered with an `employeeId` (e.g., `MSN10000`) or signed in with a `@motherson.com` corporate email, `isEmployee` is `true`, allowing `Navbar.jsx` to display the **`Motherson`** badge instead of a generic `CUSTOMER` badge.

---

### 7.4 `src/app/App.jsx` — Protected Route Guard & React Query Configuration

```jsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: (count, err) => isApiError(err) && err.unreachable && count < 1,
    },
  },
})

function RequireAuth({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  }
  return children
}
```

**What this code does:**
1. **`queryClient` configuration:** Keeps fetched data fresh for 30 seconds (`staleTime: 30_000`) so navigating back and forth between `/` and `/fleet` is instant without redundant network calls. If a request fails, `retry` checks `err.unreachable` so it only retries network/502+ failures once and immediately surfaces 400/401/403/404 errors.
2. **`RequireAuth`:** Wraps protected routes (`/fleet`, `/fleet/:id`, `/bookings`, `/bookings/:id`, `/admin`). If an unauthenticated visitor clicks a car on the public Home page, `RequireAuth` redirects them to `/login` while saving `location.pathname + location.search` in `location.state.from`. Once they sign in (or sign up), `Login.jsx` / `Signup.jsx` reads `location.state?.from` and sends them right back to the exact car and dates they were viewing.

---

### 7.5 `src/lib/trip.js` — Future Pick-Up Date & Duration Math

```js
export const MAX_DAYS = 30
export const MAX_ADVANCE_DAYS = 30
export const DURATION_DAYS = Array.from({ length: MAX_DAYS }, (_, i) => i + 1)

export const today = () => toIsoDate(new Date())

export const addDays = (iso, days) => {
  const d = toLocalMidnight(iso)
  d.setDate(d.getDate() + days)
  return toIsoDate(d)
}

export const maxStartDate = () => addDays(today(), MAX_ADVANCE_DAYS)

export const clampStartDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return today()
  const min = today()
  const max = maxStartDate()
  if (iso < min) return min
  if (iso > max) return max
  return iso
}

export const returnDateFor = (days, startIso = today()) => addDays(clampStartDate(startIso), days)
```

**What this code does:**
- Mirrors the backend constants (`MAX_DAYS = 30` and `MAX_ADVANCE_DAYS = 30` in `RentalService.java`).
- Uses `toLocalMidnight(iso)` instead of `new Date(iso)` so `YYYY-MM-DD` strings are parsed in the user's local timezone rather than UTC (preventing off-by-one date bugs in IST `+05:30`).
- `clampStartDate(iso)` guarantees that even if a user manually edits `?start=...` in the URL, the pick-up date is clamped between today and 30 days ahead.
- `returnDateFor(days, startIso)` computes the return date by adding `days` to the chosen `startIso` pick-up date.

---

### 7.6 `src/pages/Fleet.jsx` — URL-Driven Filtering & Sorting

```jsx
  const start = clampStartDate(params.get('start'))
  const days = clampDays(Number(params.get('days') ?? 1))
  const category = params.get('category') ?? ''
  const onlyAvailable = params.get('available') !== 'false'
  const maxPrice = Number(params.get('max') ?? 0)
  const sort = params.get('sort') ?? 'relevance'
  const q = params.get('q') ?? ''

  const list = useMemo(() => {
    let l = cars.data ?? []
    if (onlyAvailable) l = l.filter((c) => c.available)
    if (category) l = l.filter((c) => String(c.category.id) === category)
    if (maxPrice) l = l.filter((c) => c.pricePerDay <= maxPrice)
    if (q) l = l.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    const s = [...l]
    if (sort === 'price-asc') s.sort((a, b) => a.pricePerDay - b.pricePerDay)
    if (sort === 'price-desc') s.sort((a, b) => b.pricePerDay - a.pricePerDay)
    if (sort === 'name') s.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'relevance') s.sort((a, b) => Number(b.available) - Number(a.available) || Number(!!b.imageUrl) - Number(!!a.imageUrl))
    return s
  }, [cars.data, onlyAvailable, category, maxPrice, q, sort])
```

**What this code does:**
- Instead of storing filter state in local `useState` variables that get lost on page refresh, `Fleet.jsx` derives all filters directly from `useSearchParams()`.
- `useMemo` recomputes the filtered and sorted vehicle list in memory whenever `cars.data` or any URL filter changes, prioritizing available cars with photos when sorted by `'relevance'`.

---

### 7.7 `src/pages/CarDetail.jsx` — Live Price Receipt & Checkout Mutation

```jsx
  const c = car.data
  const catPct = Number(c.category.discountPercent) || 0
  const coupon = coupons.data?.find((x) => x.code.toUpperCase() === couponCode.trim().toUpperCase())
  const pct = benefit === 'CATEGORY_DISCOUNT' ? catPct : benefit === 'COUPON' && coupon ? Number(coupon.discountPercent) : 0
  const gross = c.pricePerDay * days
  const total = gross - (gross * pct) / 100
```

**What this code does:**
- Dynamically calculates the live receipt estimate as the customer changes trip duration, dates, or benefit type:
  - If `benefit === 'CATEGORY_DISCOUNT'`, applies the vehicle category's discount percentage (`catPct`).
  - If `benefit === 'COUPON'` and the entered/selected code matches a coupon in `coupons.data`, applies `coupon.discountPercent`.
  - Updates `gross` (`pricePerDay * days`), the discount line item (`gross - total`), and the animated `<Counter value={total} prefix="₹ " />` in real time.

---

### 7.8 `src/pages/MyBookings.jsx` — Optimistic UI Updates for Returning a Car

```jsx
  const ret = useMutation({
    mutationFn: (id) => api.cancelBooking(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData(key)
      qc.setQueryData(key, (l) => l?.map((r) => (r.id === id ? { ...r, status: 'COMPLETED' } : r)))
      return { prev }
    },
    onError: (e, _id, ctx) => {
      qc.setQueryData(key, ctx?.prev)
      toast.error(isApiError(e) ? e.message : 'Could not end the rental. Try again.')
    },
    onSuccess: (r) => toast.success(`${r.vehicle.name} returned. ${bookingRef(r.id)} is complete.`),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['cars'] })
    },
  })
```

**What this code does:**
1. **`onMutate` (Optimistic Update):** As soon as the customer confirms returning a car, React Query cancels any in-flight fetches, snapshots the current bookings array (`prev`), and immediately flips that booking's status to `'COMPLETED'` in the cache so it animates out of the `Active` tab without waiting for the network round-trip.
2. **`onError` (Rollback):** If the `PUT /api/rentals/{id}/return` call fails, it rolls the cache back to `ctx.prev` and shows an error toast.
3. **`onSettled` (Resync):** Invalidates both `['my-bookings', email]` and `['cars']` so the returned car is marked `Available` again across the fleet.

---

### 7.9 `src/pages/Admin.jsx` — Live Operational KPIs & Reusable Slide-Over Forms

```jsx
  const stats = useMemo(() => {
    const allRentals = bookings.data ?? []
    const revenue = allRentals.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0)
    const activeCount = allRentals.filter((r) => r.status === 'ACTIVE').length
    const totalCars = cars.data?.length ?? 0
    const availCars = cars.data?.filter((c) => c.available).length ?? 0
    return { revenue, activeCount, totalCars, availCars, totalRentals: allRentals.length }
  }, [bookings.data, cars.data])
```

**What this code does:**
- Aggregates live data from `useAllBookings()` and `useCars()` to drive the 5 Night-Drive KPI odometer cards (`Cumulative Revenue`, `Active on the Road`, `Available on the Lot`, `Active Customers`, `Active Coupons`). Whenever an admin returns a car, adds a vehicle, or creates a coupon, React Query invalidates the underlying query and `stats` updates automatically.
- Uses shared `DataTable` and `FormSlideOver` components in `Admin.jsx` so all 5 tabs (`Fleet Vehicles`, `Rentals & Timeline`, `Categories`, `Coupons`, `Customers`) share consistent table headers, slide-over animations, and loading states.

---

### 7.10 `src/components/fx/Counter.jsx` — Indian Numbering Odometer Animation

```jsx
const inrNumber = new Intl.NumberFormat('en-IN')

export function Counter({ value, prefix, suffix, className }) {
  const safeValue = Math.max(0, Math.round(Number(value) || 0))
  const formatted = inrNumber.format(safeValue)

  return (
    <span className={cn('mono inline-flex items-center tabular-nums leading-none', className)} aria-label={`${prefix ?? ''}${formatted}${suffix ?? ''}`}>
      {prefix && <span className="inline-flex h-[1em] items-center whitespace-pre leading-none">{prefix}</span>}
      {Array.from(formatted).map((ch, i) =>
        ch >= '0' && ch <= '9' ? (
          <Digit key={i} d={Number(ch)} />
        ) : (
          <span key={i} className="inline-flex h-[1em] items-center leading-none">
            {ch}
          </span>
        ),
      )}
      {suffix && <span className="inline-flex h-[1em] items-center whitespace-pre leading-none">{suffix}</span>}
    </span>
  )
}
```

**What this code does:**
- Formats any number using `Intl.NumberFormat('en-IN')` (e.g., `57588946` → `"5,75,88,946"`).
- Splits the formatted string character by character: numeric digits (`0–9`) render as vertical rolling `<Digit />` strips animated with `motion.span`, while commas, `prefix` (`₹`), and `suffix` (` Cars`, ` / 78`) render inside `inline-flex h-[1em] items-center leading-none` boxes so every symbol and digit aligns on the exact same vertical center line.
