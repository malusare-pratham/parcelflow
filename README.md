# 🚛 ParcelFlow — Same-Day Parcel Delivery Marketplace

A production-ready MERN stack logistics platform connecting **drivers** with scheduled routes to **customers** who need same-day parcel delivery. Think Uber + BlaBlaCar for parcels.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + Role-based middleware |
| File Upload | Multer (local storage) |
| Deployment | Vercel (frontend) + Render (backend) + MongoDB Atlas |

---

## 🏗️ Project Structure

```
parcelflow/
├── client/                  # React frontend (Vite)
│   └── src/
│       ├── components/      # Navbar, Layouts, Shared UI
│       ├── context/         # AuthContext
│       ├── pages/
│       │   ├── auth/        # Login, Register
│       │   ├── customer/    # Home, Trips, Booking, My Bookings
│       │   ├── driver/      # Dashboard, Create Trip, Upload Docs, Bookings, Earnings
│       │   └── admin/       # Dashboard, Drivers, Driver Detail, Trips, Bookings, Customers
│       └── utils/           # Axios instance
│
└── server/                  # Express backend
    ├── controllers/         # Auth, Driver, Customer, Admin
    ├── middleware/          # JWT auth, Multer upload
    ├── models/              # User, DriverProfile, Trip, Booking
    ├── routes/              # Auth, Driver, Customer, Admin
    ├── uploads/             # Local KYC document storage
    ├── seed.js              # Demo data seeder
    └── index.js             # Entry point
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (Atlas or local)
- npm or yarn

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment Variables

**Server** — copy `server/.env.example` → `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/parcelflow
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Client** — copy `client/.env.example` → `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_UPLOADS_URL=http://localhost:5000/uploads
```

### 3. Seed Demo Data

```bash
cd server
node seed.js
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open **http://localhost:5173**

---

---

## 🧑‍💼 Role Workflows

### Customer
1. Register / Login
2. Search trips by route + date
3. View trip details
4. Book a parcel slot (fill parcel details + receiver info) â€” booking stays pending until driver confirms
5. Receive Booking ID
6. Track status in "My Bookings"
7. Pay cash when delivered

### ParcelFlow – Customer Instructions & Disclaimer
ParcelFlow is only a platform to connect customers and drivers. We do not provide delivery service and we do not handle payments.

**Before booking**
- Enter correct pickup and delivery address
- Provide a valid phone number
- Add clear parcel details (and mark fragile items)

**Packaging**
- Pack properly and securely (use a strong box/cover)

**Not allowed items**
- Illegal items, dangerous/explosive items, drugs/restricted goods
- If found, booking will be cancelled

**Pickup & delivery**
- Be on time at pickup, keep parcel ready (driver waits max 30 minutes)
- Receiver must be available and reachable; share correct receiver details

**Payment**
- Cash on Delivery (COD) â€” pay directly to the driver; ParcelFlow does not handle payments

**Important disclaimer**
- ParcelFlow is not responsible for parcel loss/damage, delivery delays, or driver behavior
- We only connect the customer and the driver; responsibility is between you and the driver

In the app, customers can read the full version at `/customer-instructions`, and booking requires accepting these rules.

### Driver
1. Register as Driver
2. Upload KYC documents (Aadhaar, License, Vehicle RC, Vehicle Insurance, PUC Certificate, Vehicle Photo, Selfie with Vehicle)
3. Wait for Admin verification
4. Create trips (route, date, time, capacity, price) — Maharashtra district dropdown (you can type any city/taluka)
5. Wait for Admin trip approval
6. View booking requests and confirm/reject them
7. Update delivery status (Booked → Picked → In Transit → Delivered)
8. Collect cash from customer on delivery

### Admin
1. Login to admin console
2. Review driver KYC submissions → Approve or Reject with reason
3. Review trip submissions → Approve or Reject
4. Monitor all bookings across platform
5. Manage customer accounts (activate/deactivate)
6. View platform stats and health metrics

---

## 🌐 API Reference

### Auth
```
POST /api/auth/register     — Register (customer or driver)
POST /api/auth/login        — Login (all roles)
GET  /api/auth/me           — Get current user
```

### Customer (Public + Protected)
```
GET  /api/customer/trips                    — Search trips
GET  /api/customer/trips/:id                — Trip details
POST /api/customer/bookings                 — Create booking [auth: customer]
GET  /api/customer/bookings/my              — My bookings [auth: customer]
PUT  /api/customer/bookings/:id/cancel      — Cancel booking [auth: customer]
```

### Driver [auth: driver]
```
GET  /api/driver/profile
POST /api/driver/upload-docs         — Multipart: aadhaar, license, vehicleRC, vehicleInsurance, pucCertificate, vehicleImage, selfie
POST /api/driver/create-trip
GET  /api/driver/trips
GET  /api/driver/bookings
PUT  /api/driver/booking/:id/status  — Update delivery status
GET  /api/driver/earnings
```

### Admin [auth: admin]
```
GET  /api/admin/stats
GET  /api/admin/drivers
GET  /api/admin/drivers/:id

---

## 📝 Recent Changes (Dev Notes)

### 2026-04-28
- **Customer trip search date fix:** `/api/customer/trips?date=YYYY-MM-DD` आता local date म्हणून parse होतो (timezone shift मुळे trips mismatch होऊ नये म्हणून). (`server/controllers/customerController.js`)
- **Show full trips in search:** trips search मध्ये `availableSlots > 0` filter काढला, त्यामुळे approved पण full trips सुद्धा list मध्ये दिसतात. (`server/controllers/customerController.js`)
- **City dropdown/typing:** `Origin (City)` / `Destination (City)` inputs मध्ये dropdown + type-to-search add केला. (`client/src/components/CityCombobox.jsx`, `client/src/constants/cityOptions.js`, `client/src/pages/customer/HomePage.jsx`, `client/src/pages/customer/TripsPage.jsx`, `client/src/pages/driver/CreateTripPage.jsx`)
- **Login → Book redirect:** `TripDetail` वरून “Login to Book” केल्यावर login नंतर auto `/book/:tripId` वर redirect होतो (`?next=` param वापरून). (`client/src/pages/customer/TripDetailPage.jsx`, `client/src/pages/auth/LoginPage.jsx`)
- **Booking images required (min 2):** Book Parcel मध्ये किमान 2 images upload आवश्यक; mobile वर “Take Photo” option ने direct photo capture होतो. (`client/src/pages/customer/BookingPage.jsx`, `server/controllers/customerController.js`)
PUT  /api/admin/verify-driver/:id    — { status: 'approved'|'rejected', rejectionReason? }
GET  /api/admin/trips
PUT  /api/admin/trips/:id/status     — { status: 'approved'|'rejected', rejectionReason? }
GET  /api/admin/bookings
GET  /api/admin/customers
PUT  /api/admin/users/:id/toggle     — Activate/deactivate user
```

---

## 🚀 Deployment

### Frontend → Vercel
1. Push `client/` to GitHub
2. Connect to Vercel → set root as `client`
3. Set env: `VITE_API_URL=https://your-render-api.com/api`
4. Set env: `VITE_UPLOADS_URL=https://your-render-api.com/uploads`

### Backend → Render
1. Push `server/` to GitHub
2. Create Web Service on Render
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add env vars from `.env`

### MongoDB → Atlas
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Whitelist `0.0.0.0/0` for Render
3. Update `MONGO_URI` in Render env vars

### File Storage Note
For production, replace Multer local storage with **Cloudinary** or **AWS S3**:
- Install `cloudinary` or `@aws-sdk/client-s3`
- Update `middleware/upload.js` to use cloud storage
- Update `VITE_UPLOADS_URL` to your CDN URL

---

## 📦 Database Models

### User
`name · phone · email · password · role (admin|driver|customer) · isVerified · isActive`

### DriverProfile
`userId · aadhaar · license · vehicleRC · vehicleInsurance · pucCertificate · vehicleImage · selfie · vehicleNumber · vehicleName · vehicleColor · vehicleType · verificationStatus (pending|approved|rejected) · rejectionReason · totalEarnings`

### Trip
`driverId · from (origin city) · pickupLocation · to (destination city) · dropLocation · date · time · capacity · availableSlots · pricePerKg · status (pending|approved|rejected|completed) · notes`

### Booking
Note: `bookingId` is generated server-side (format `PF-XXXXXXXXXX`) and is unique per booking.

`tripId · customerId · bookingId · confirmationStatus (pending|confirmed|rejected) · parcelDetails{description,weight,receiverName,receiverPhone,deliveryAddress} · amount · status (booked|picked|in-transit|delivered|cancelled) · paymentStatus`

---

## 🔒 Security Notes
- Change `JWT_SECRET` before production
- Enable MongoDB Atlas IP whitelist properly
- Use HTTPS in production (Render provides SSL)
- Consider rate limiting with `express-rate-limit`
- For production file storage, migrate to S3/Cloudinary

---

Built with ❤️ using the MERN Stack
