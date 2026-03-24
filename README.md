🏛️ Hutatma Smruti Mandir – Online Booking System
Solapur Municipal Corporation (SMC)

A full-stack web application designed to streamline premises booking, payments, cancellations, and complaint management for Hutatma Smruti Mandir under Solapur Municipal Corporation.

📌 Overview

This system enables citizens to:

Check availability of premises
Book venues through a guided workflow
Make payments and download receipts
Cancel bookings with OTP verification
Raise complaints

It also provides an admin dashboard for managing operations, ensuring transparency and efficiency.

🧱 Tech Stack
Layer	Technology
Frontend	Angular 17
Backend	Django 5 + Django REST Framework
Database	SQL Server 2022
Auth	JWT (Access + Refresh Tokens)
Reports	ReportLab (PDF generation)


**Folder Structure**

hsm-booking/
├── frontend/                # Angular Application
│   └── src/app/
│       ├── core/            # Guards, Interceptors, Models, Services
│       ├── shared/          # Common UI Components
│       └── features/        # Feature Modules
│           ├── home/
│           ├── about/
│           ├── booking/
│           ├── gallery/
│           ├── contact/
│           ├── print-booking/
│           └── admin/
│
└── backend/                # Django Application
    ├── config/             # Settings & Configuration
    ├── apps/
    │   ├── accounts/       # Authentication & Users
    │   ├── premises/       # Premises & Slot Management
    │   ├── bookings/       # Booking Logic
    │   ├── payments/       # Payment Tracking
    │   ├── cancellations/  # Cancellation & Refunds
    │   ├── complaints/     # Complaint System
    │   └── notifications/  # Email/SMS Services
    └── utils/
        └── pdf_generator.py



**⚙️ Setup Instructions**
**🔹 Backend Setup (Django + SQL Server)**
cd backend

# Install dependencies
pip install -r requirements.txt

# Environment setup
cp .env.example .env
# Update database credentials in .env

# Apply migrations
python manage.py makemigrations
python manage.py migrate

# Load initial data
python manage.py shell < seed_data.py

# Run server
python manage.py runserver

Default Admin Credentials:
Email: admin@solapurcorp.gov.in

**🔹 Frontend Setup (Angular)**
cd frontend

# Install dependencies
npm install

# Run application
ng serve

Access the app at:
👉 http://localhost:4200

**🌐 API Endpoints
🔓 Public APIs**
Method	Endpoint	Description
GET	/api/premises/	List premises
GET	/api/premises/{id}/slots/	Get slots
GET	/api/bookings/availability/	Check availability
POST	/api/bookings/calculate/	Calculate cost
POST	/api/bookings/	Create booking
GET	/api/bookings/lookup/	Search booking
GET	/api/bookings/{id}/receipt/	Download receipt
POST	/api/cancellations/request/	Request cancellation
POST	/api/cancellations/verify-otp/	Verify OTP
POST	/api/complaints/	Submit complaint
POST	/api/auth/login/	Admin login

**🔐 Admin APIs (JWT Required)**
Method	Endpoint	Description
GET/POST/PUT	/api/premises/	Manage premises
GET/POST/PUT	/api/premises/holidays/	Manage holidays
GET	/api/bookings/	View bookings
POST	/api/bookings/{id}/approve/	Approve booking
POST	/api/bookings/{id}/reject/	Reject booking
GET	/api/payments/	Payment records
GET	/api/cancellations/records/	Cancellation records
POST	/api/cancellations/records/{id}/approve/	Approve cancellation
GET	/api/complaints/	View complaints


**💰 Pricing Logic**
Base Rent = premise.base_rent × total_days × slot.multiplier
Holiday Charges = holiday_days × base_daily_rent × (holiday_multiplier - 1)
CGST (9%) = base_rent × 0.09  
SGST (9%) = base_rent × 0.09  
Security Deposit = Fixed (Refundable)
------------------------------------------------
TOTAL PAYABLE =
Base Rent + Holiday Charges + CGST + SGST + Security Deposit


**❌ Cancellation & Refund Policy**
Time Before Event	Refund
≥ 60 days	90%
≥ 30 days	80%
≥ 7 days	50%
< 7 days	Security Deposit Only

**🔐 Security Features**
JWT-based authentication (Access + Refresh Tokens)
Role-based access control (Admin, Staff)
Input validation using DRF serializers
SQL injection protection via ORM
OTP-based cancellation verification
Secure file upload handling
Configured CORS policies

**🌍 Internationalization (i18n)**
Supports:
English
Marathi (मराठी)
Language toggle available in UI
Preferences stored in browser (localStorage)

**📦 Key Features**
Multi-step booking workflow
Real-time availability checking
Automated rent calculation
PDF receipt generation
OTP-based cancellation
Complaint management system
Admin dashboard with full control

**🚀 Future Enhancements**
Online payment gateway integration (Razorpay / Paytm)
SMS & WhatsApp notifications
Advanced analytics dashboard
Mobile app (PWA or Native)

**📄 License**
This project is developed for Solapur Municipal Corporation (SMC) and is intended for internal/public service use.
