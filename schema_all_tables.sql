-- SQL Server schema for HSM Booking project
-- This script defines tables corresponding to Django models found in the codebase.
-- Adjust data types, lengths and constraints as needed before running.

/* accounts */
CREATE TABLE hsm_admin_users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(254) NOT NULL UNIQUE,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    mobile NVARCHAR(15) NULL,
    role NVARCHAR(20) NOT NULL DEFAULT 'clerk',
    department NVARCHAR(100) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    is_staff BIT NOT NULL DEFAULT 0,
    date_joined DATETIME2 NOT NULL DEFAULT GETDATE(),
    last_login_ip NVARCHAR(45) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

/* premises */
CREATE TABLE hsm_premises (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    capacity INT NOT NULL,
    area_sqft DECIMAL(10,2) NULL,
    base_rate DECIMAL(12,2) NOT NULL,
    security_deposit DECIMAL(12,2) NOT NULL,
    icon NVARCHAR(50) NOT NULL DEFAULT 'location_on',
    is_active BIT NOT NULL DEFAULT 1,
    facilities NVARCHAR(MAX) NULL,
    rules NVARCHAR(MAX) NULL,
    images NVARCHAR(MAX) NULL,     -- JSON
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE hsm_premise_rates (
    id INT IDENTITY(1,1) PRIMARY KEY,
    premise_id INT NOT NULL REFERENCES hsm_premises(id),
    rate_type NVARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    is_active BIT NOT NULL DEFAULT 1,
    CONSTRAINT UQ_PremiseRate UNIQUE(premise_id, rate_type, effective_from)
);

CREATE TABLE hsm_time_slots (
    id INT IDENTITY(1,1) PRIMARY KEY,
    premise_id INT NOT NULL REFERENCES hsm_premises(id),
    name NVARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    max_bookings_per_day SMALLINT NOT NULL DEFAULT 1,
    is_active BIT NOT NULL DEFAULT 1
);

CREATE TABLE hsm_holidays (
    id INT IDENTITY(1,1) PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    name NVARCHAR(200) NOT NULL,
    charge_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    description NVARCHAR(MAX) NULL
);

CREATE TABLE hsm_gallery (
    id INT IDENTITY(1,1) PRIMARY KEY,
    premise_id INT NULL REFERENCES hsm_premises(id),
    item_type NVARCHAR(10) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX) NULL,
    file NVARCHAR(500) NULL,
    url NVARCHAR(500) NULL,
    thumbnail NVARCHAR(500) NULL,
    is_active BIT NOT NULL DEFAULT 1,
    sort_order SMALLINT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

/* bookings */
CREATE TABLE hsm_booking_migrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id NVARCHAR(100) NOT NULL UNIQUE,
    premise_id INT NULL REFERENCES hsm_premises(id),
    start_date DATE NULL,
    end_date DATE NULL,
    slot_id INT NULL REFERENCES hsm_time_slots(id),
    status NVARCHAR(30) NOT NULL DEFAULT 'draft',
    data NVARCHAR(MAX) NOT NULL, -- JSON
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE hsm_bookings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id NVARCHAR(20) NOT NULL UNIQUE,
    migration_id INT NULL REFERENCES hsm_booking_migrations(id),
    premise_id INT NOT NULL REFERENCES hsm_premises(id),
    slot_id INT NULL REFERENCES hsm_time_slots(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days SMALLINT NOT NULL,
    applicant_name NVARCHAR(200) NOT NULL,
    applicant_address NVARCHAR(MAX) NOT NULL,
    mobile NVARCHAR(15) NOT NULL,
    alt_mobile NVARCHAR(15) NULL,
    email NVARCHAR(254) NOT NULL,
    function_name NVARCHAR(200) NOT NULL,
    function_type NVARCHAR(100) NOT NULL,
    guest_count INT NOT NULL,
    additional_details NVARCHAR(MAX) NULL,
    id_proof_type NVARCHAR(20) NOT NULL,
    id_proof_file NVARCHAR(500) NULL,
    bank_name NVARCHAR(200) NOT NULL,
    account_holder NVARCHAR(200) NOT NULL,
    account_number_encrypted NVARCHAR(500) NOT NULL,
    ifsc NVARCHAR(15) NOT NULL,
    branch NVARCHAR(200) NOT NULL,
    micr NVARCHAR(9) NULL,
    base_rent DECIMAL(14,2) NOT NULL,
    holiday_charges DECIMAL(14,2) NOT NULL DEFAULT 0,
    slot_charges DECIMAL(14,2) NOT NULL DEFAULT 0,
    security_deposit DECIMAL(14,2) NOT NULL,
    subtotal DECIMAL(14,2) NOT NULL,
    cgst DECIMAL(14,2) NOT NULL,
    sgst DECIMAL(14,2) NOT NULL,
    total_payable DECIMAL(14,2) NOT NULL,
    payment_mode NVARCHAR(20) NOT NULL,
    payment_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    rejection_reason NVARCHAR(MAX) NULL,
    approved_by INT NULL REFERENCES hsm_admin_users(id),
    approved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_bookings_booking_id ON hsm_bookings(booking_id);
CREATE INDEX IX_bookings_mobile ON hsm_bookings(mobile);
CREATE INDEX IX_bookings_status ON hsm_bookings(status);
CREATE INDEX IX_bookings_dates ON hsm_bookings(start_date, end_date);
CREATE INDEX IX_bookings_premise_dates ON hsm_bookings(premise_id, start_date, end_date);

CREATE TABLE hsm_receipts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES hsm_bookings(id),
    receipt_number NVARCHAR(30) NOT NULL UNIQUE,
    generated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    generated_by INT NULL REFERENCES hsm_admin_users(id),
    pdf_file NVARCHAR(500) NULL,
    is_duplicate BIT NOT NULL DEFAULT 0
);

/* cancellations */
CREATE TABLE hsm_cancellations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES hsm_bookings(id),
    reason NVARCHAR(MAX) NOT NULL,
    requested_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    otp NVARCHAR(6) NULL,
    otp_verified BIT NOT NULL DEFAULT 0,
    otp_expires_at DATETIME2 NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    refund_amount DECIMAL(14,2) NULL,
    refund_percentage DECIMAL(5,2) NULL,
    refund_status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    refund_processed_at DATETIME2 NULL,
    refund_reference NVARCHAR(100) NULL,
    reviewed_by INT NULL REFERENCES hsm_admin_users(id),
    reviewed_at DATETIME2 NULL,
    rejection_reason NVARCHAR(MAX) NULL
);

/* complaints */
CREATE TABLE hsm_complaints (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    email NVARCHAR(254) NOT NULL,
    mobile NVARCHAR(15) NOT NULL,
    subject NVARCHAR(300) NOT NULL,
    message NVARCHAR(MAX) NOT NULL,
    booking_id NVARCHAR(20) NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'open',
    admin_remarks NVARCHAR(MAX) NULL,
    assigned_to INT NULL REFERENCES hsm_admin_users(id),
    resolved_at DATETIME2 NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

/* apps.payments */
CREATE TABLE Payments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES Bookings(id),
    transaction_ref NVARCHAR(100) NULL,
    payment_mode NVARCHAR(30) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATETIME2 NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    bank_ref NVARCHAR(100) NULL,
    verified_by INT NULL REFERENCES hsm_admin_users(id),
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);

CREATE TABLE Receipts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES Bookings(id),
    receipt_number NVARCHAR(30) NOT NULL UNIQUE,
    generated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    pdf_file NVARCHAR(500) NULL
);

/* apps.bookings */
CREATE TABLE Bookings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    booking_id NVARCHAR(20) NOT NULL UNIQUE,
    premise_id INT NOT NULL REFERENCES Premises(id),
    slot_id INT NOT NULL REFERENCES TimeSlots(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    total_days INT NOT NULL,
    full_name NVARCHAR(200) NOT NULL,
    address NVARCHAR(MAX) NOT NULL,
    mobile NVARCHAR(10) NOT NULL,
    alt_mobile NVARCHAR(10) NULL,
    email NVARCHAR(254) NOT NULL,
    function_name NVARCHAR(200) NOT NULL,
    function_type NVARCHAR(50) NOT NULL,
    expected_guests INT NOT NULL,
    id_proof_type NVARCHAR(10) NOT NULL,
    id_proof_number NVARCHAR(20) NOT NULL,
    id_proof_file NVARCHAR(500) NULL,
    bank_name NVARCHAR(200) NOT NULL,
    account_holder NVARCHAR(200) NOT NULL,
    account_number NVARCHAR(50) NOT NULL,
    ifsc_code NVARCHAR(15) NOT NULL,
    branch_name NVARCHAR(200) NOT NULL,
    micr_code NVARCHAR(9) NULL,
    base_rent DECIMAL(12,2) NOT NULL,
    holiday_charges DECIMAL(12,2) NOT NULL DEFAULT 0,
    security_deposit DECIMAL(12,2) NOT NULL,
    cgst DECIMAL(12,2) NOT NULL,
    sgst DECIMAL(12,2) NOT NULL,
    total_payable DECIMAL(12,2) NOT NULL,
    payment_mode NVARCHAR(20) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_remarks NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    approved_at DATETIME2 NULL,
    approved_by INT NULL REFERENCES hsm_admin_users(id)
);

CREATE INDEX IX_Bookings_dates ON Bookings(from_date, to_date);
CREATE INDEX IX_Bookings_premise_date ON Bookings(premise_id, from_date);

CREATE TABLE BookingMigrations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    session_id NVARCHAR(100) NOT NULL UNIQUE,
    premise_id INT NULL REFERENCES Premises(id),
    slot_id INT NULL REFERENCES TimeSlots(id),
    from_date DATE NULL,
    to_date DATE NULL,
    step_data NVARCHAR(MAX) NOT NULL,
    current_step INT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
);
