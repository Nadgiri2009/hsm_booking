CREATE TABLE [AdminUsers] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [password] nvarchar(128) NOT NULL,
    [last_login] datetimeoffset NULL,
    [is_superuser] bit NOT NULL,
    [email] nvarchar(254) NOT NULL UNIQUE,
    [name] nvarchar(200) NOT NULL,
    [role] nvarchar(20) NOT NULL,
    [is_active] bit NOT NULL,
    [is_staff] bit NOT NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL
);

CREATE TABLE [AdminUsers_groups] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [adminuser_id] bigint NOT NULL,
    [group_id] int NOT NULL
);

CREATE TABLE [AdminUsers_user_permissions] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [adminuser_id] bigint NOT NULL,
    [permission_id] int NOT NULL
);

CREATE INDEX [AdminUsers_user_permissions_adminuser_id_740f260b] ON [AdminUsers_user_permissions] ([adminuser_id]);
CREATE INDEX [AdminUsers_groups_group_id_edcdffbb] ON [AdminUsers_groups] ([group_id]);
ALTER TABLE [AdminUsers_groups] ADD CONSTRAINT [AdminUsers_groups_group_id_edcdffbb_fk_auth_group_id]
    FOREIGN KEY ([group_id]) REFERENCES [auth_group] ([id]);
ALTER TABLE [AdminUsers_groups] ADD CONSTRAINT [AdminUsers_groups_adminuser_id_6d7c3515_fk_AdminUsers_id]
    FOREIGN KEY ([adminuser_id]) REFERENCES [AdminUsers] ([id]);
CREATE UNIQUE INDEX [AdminUsers_user_permissions_adminuser_id_permission_id_b571fd62_uniq]
    ON [AdminUsers_user_permissions] ([adminuser_id], [permission_id])
    WHERE [adminuser_id] IS NOT NULL AND [permission_id] IS NOT NULL;
CREATE INDEX [AdminUsers_user_permissions_permission_id_4de973a7] ON [AdminUsers_user_permissions] ([permission_id]);
ALTER TABLE [AdminUsers_user_permissions] ADD CONSTRAINT [AdminUsers_user_permissions_adminuser_id_740f260b_fk_AdminUsers_id]
    FOREIGN KEY ([adminuser_id]) REFERENCES [AdminUsers] ([id]);
ALTER TABLE [AdminUsers_user_permissions] ADD CONSTRAINT [AdminUsers_user_permissions_permission_id_4de973a7_fk_auth_permission_id]
    FOREIGN KEY ([permission_id]) REFERENCES [auth_permission] ([id]);
CREATE UNIQUE INDEX [AdminUsers_groups_adminuser_id_group_id_4489ff1e_uniq]
    ON [AdminUsers_groups] ([adminuser_id], [group_id])
    WHERE [adminuser_id] IS NOT NULL AND [group_id] IS NOT NULL;

CREATE TABLE [Holidays] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [name] nvarchar(200) NOT NULL,
    [date] date NOT NULL UNIQUE,
    [charge_multiplier] numeric(4, 2) NOT NULL,
    [created_at] datetimeoffset NOT NULL
);

CREATE TABLE [Premises] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [name] nvarchar(200) NOT NULL,
    [name_mr] nvarchar(200) NOT NULL,
    [description] nvarchar(max) NOT NULL,
    [capacity] int NOT NULL CONSTRAINT Premises_capacity_bebc66c4_check CHECK ([capacity] >= 0),
    [base_rent] numeric(10, 2) NOT NULL,
    [security_deposit] numeric(10, 2) NOT NULL,
    [is_active] bit NOT NULL,
    [image] nvarchar(100) NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL
);

CREATE TABLE [PremiseRates] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [rate_type] nvarchar(50) NOT NULL,
    [multiplier] numeric(4, 2) NOT NULL,
    [effective_from] date NOT NULL,
    [effective_to] date NULL,
    [created_at] datetimeoffset NOT NULL,
    [premise_id] bigint NOT NULL
);

CREATE TABLE [TimeSlots] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [name] nvarchar(100) NOT NULL,
    [start_time] time NOT NULL,
    [end_time] time NOT NULL,
    [multiplier] numeric(4, 2) NOT NULL,
    [is_active] bit NOT NULL,
    [premise_id] bigint NOT NULL
);

ALTER TABLE [PremiseRates] ADD CONSTRAINT [PremiseRates_premise_id_c7f97453_fk_Premises_id]
    FOREIGN KEY ([premise_id]) REFERENCES [Premises] ([id]);
CREATE INDEX [PremiseRates_premise_id_c7f97453] ON [PremiseRates] ([premise_id]);
ALTER TABLE [TimeSlots] ADD CONSTRAINT [TimeSlots_premise_id_2612b6e6_fk_Premises_id]
    FOREIGN KEY ([premise_id]) REFERENCES [Premises] ([id]);
CREATE INDEX [TimeSlots_premise_id_2612b6e6] ON [TimeSlots] ([premise_id]);

CREATE TABLE [BookingMigrations] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [session_id] nvarchar(100) NOT NULL UNIQUE,
    [from_date] date NULL,
    [to_date] date NULL,
    [step_data] nvarchar(max) NOT NULL CONSTRAINT BookingMigrations_step_data_fa4d370b_check CHECK ((ISJSON ("step_data") = 1)),
    [current_step] int NOT NULL CONSTRAINT BookingMigrations_current_step_faee2932_check CHECK ([current_step] >= 0),
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL,
    [premise_id] bigint NULL,
    [slot_id] bigint NULL
);

CREATE TABLE [Bookings] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [booking_id] nvarchar(20) NOT NULL UNIQUE,
    [from_date] date NOT NULL,
    [to_date] date NOT NULL,
    [total_days] int NOT NULL CONSTRAINT Bookings_total_days_84008226_check CHECK ([total_days] >= 0),
    [full_name] nvarchar(200) NOT NULL,
    [address] nvarchar(max) NOT NULL,
    [mobile] nvarchar(10) NOT NULL,
    [alt_mobile] nvarchar(10) NOT NULL,
    [email] nvarchar(254) NOT NULL,
    [function_name] nvarchar(200) NOT NULL,
    [function_type] nvarchar(50) NOT NULL,
    [expected_guests] int NOT NULL CONSTRAINT Bookings_expected_guests_4c815b7c_check CHECK ([expected_guests] >= 0),
    [id_proof_type] nvarchar(10) NOT NULL,
    [id_proof_number] nvarchar(20) NOT NULL,
    [id_proof_file] nvarchar(100) NULL,
    [bank_name] nvarchar(200) NOT NULL,
    [account_holder] nvarchar(200) NOT NULL,
    [account_number] nvarchar(50) NOT NULL,
    [ifsc_code] nvarchar(15) NOT NULL,
    [branch_name] nvarchar(200) NOT NULL,
    [micr_code] nvarchar(9) NOT NULL,
    [base_rent] numeric(12, 2) NOT NULL,
    [holiday_charges] numeric(12, 2) NOT NULL,
    [security_deposit] numeric(12, 2) NOT NULL,
    [cgst] numeric(12, 2) NOT NULL,
    [sgst] numeric(12, 2) NOT NULL,
    [total_payable] numeric(12, 2) NOT NULL,
    [payment_mode] nvarchar(20) NOT NULL,
    [status] nvarchar(20) NOT NULL,
    [admin_remarks] nvarchar(max) NOT NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL,
    [approved_at] datetimeoffset NULL,
    [approved_by_id] bigint NULL,
    [premise_id] bigint NOT NULL,
    [slot_id] bigint NOT NULL
);

CREATE INDEX [Bookings_from_da_95b8a0_idx] ON [Bookings] ([from_date], [to_date]);
CREATE INDEX [BookingMigrations_premise_id_20a4ab4e] ON [BookingMigrations] ([premise_id]);
ALTER TABLE [BookingMigrations] ADD CONSTRAINT [BookingMigrations_slot_id_f59dc4a8_fk_TimeSlots_id]
    FOREIGN KEY ([slot_id]) REFERENCES [TimeSlots] ([id]);
CREATE INDEX [Bookings_from_date_24c86be5] ON [Bookings] ([from_date]);
CREATE INDEX [Bookings_approved_by_id_e3224da5] ON [Bookings] ([approved_by_id]);
ALTER TABLE [BookingMigrations] ADD CONSTRAINT [BookingMigrations_premise_id_20a4ab4e_fk_Premises_id]
    FOREIGN KEY ([premise_id]) REFERENCES [Premises] ([id]);
ALTER TABLE [Bookings] ADD CONSTRAINT [Bookings_slot_id_774d3cef_fk_TimeSlots_id]
    FOREIGN KEY ([slot_id]) REFERENCES [TimeSlots] ([id]);
CREATE INDEX [Bookings_slot_id_774d3cef] ON [Bookings] ([slot_id]);
ALTER TABLE [Bookings] ADD CONSTRAINT [Bookings_premise_id_0accedbe_fk_Premises_id]
    FOREIGN KEY ([premise_id]) REFERENCES [Premises] ([id]);
CREATE INDEX [Bookings_premise_9c1794_idx] ON [Bookings] ([premise_id], [from_date]);
CREATE INDEX [BookingMigrations_slot_id_f59dc4a8] ON [BookingMigrations] ([slot_id]);
ALTER TABLE [Bookings] ADD CONSTRAINT [Bookings_approved_by_id_e3224da5_fk_AdminUsers_id]
    FOREIGN KEY ([approved_by_id]) REFERENCES [AdminUsers] ([id]);
CREATE INDEX [Bookings_mobile_2d1d3a76] ON [Bookings] ([mobile]);
CREATE INDEX [Bookings_premise_id_0accedbe] ON [Bookings] ([premise_id]);

CREATE TABLE [Cancellations] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [reason] nvarchar(max) NOT NULL,
    [cancellation_date] date NOT NULL,
    [refund_percentage] numeric(5, 2) NOT NULL,
    [refund_amount] numeric(12, 2) NOT NULL,
    [status] nvarchar(20) NOT NULL,
    [otp] nvarchar(6) NOT NULL,
    [otp_expiry] datetimeoffset NULL,
    [otp_verified] bit NOT NULL,
    [admin_remarks] nvarchar(max) NOT NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL,
    [approved_by_id] bigint NULL,
    [booking_id] bigint NOT NULL UNIQUE
);

CREATE TABLE [Refunds] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [refund_amount] numeric(12, 2) NOT NULL,
    [bank_name] nvarchar(200) NOT NULL,
    [account_holder] nvarchar(200) NOT NULL,
    [account_number] nvarchar(50) NOT NULL,
    [ifsc_code] nvarchar(15) NOT NULL,
    [utr_number] nvarchar(50) NOT NULL,
    [status] nvarchar(20) NOT NULL,
    [processed_at] datetimeoffset NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL,
    [cancellation_id] bigint NOT NULL UNIQUE
);

ALTER TABLE [Refunds] ADD CONSTRAINT [Refunds_cancellation_id_832645ee_fk_Cancellations_id]
    FOREIGN KEY ([cancellation_id]) REFERENCES [Cancellations] ([id]);
ALTER TABLE [Cancellations] ADD CONSTRAINT [Cancellations_booking_id_d9a039ec_fk_Bookings_id]
    FOREIGN KEY ([booking_id]) REFERENCES [Bookings] ([id]);
ALTER TABLE [Cancellations] ADD CONSTRAINT [Cancellations_approved_by_id_99c6860e_fk_AdminUsers_id]
    FOREIGN KEY ([approved_by_id]) REFERENCES [AdminUsers] ([id]);
CREATE INDEX [Cancellations_approved_by_id_99c6860e] ON [Cancellations] ([approved_by_id]);

CREATE TABLE [Complaints] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [name] nvarchar(200) NOT NULL,
    [email] nvarchar(254) NOT NULL,
    [mobile] nvarchar(10) NOT NULL,
    [booking_id] nvarchar(20) NOT NULL,
    [subject] nvarchar(300) NOT NULL,
    [message] nvarchar(max) NOT NULL,
    [status] nvarchar(20) NOT NULL,
    [admin_response] nvarchar(max) NOT NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL
);

CREATE TABLE [ContactMessages] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [name] nvarchar(200) NOT NULL,
    [email] nvarchar(254) NOT NULL,
    [mobile] nvarchar(10) NOT NULL,
    [subject] nvarchar(300) NOT NULL,
    [message] nvarchar(max) NOT NULL,
    [status] nvarchar(20) NOT NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL
);

CREATE TABLE [Payments] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [transaction_ref] nvarchar(100) NOT NULL,
    [payment_mode] nvarchar(30) NOT NULL,
    [amount_paid] numeric(12, 2) NOT NULL,
    [payment_date] datetimeoffset NULL,
    [status] nvarchar(20) NOT NULL,
    [bank_ref] nvarchar(100) NOT NULL,
    [created_at] datetimeoffset NOT NULL,
    [updated_at] datetimeoffset NOT NULL,
    [booking_id] bigint NOT NULL UNIQUE,
    [verified_by_id] bigint NULL
);

CREATE TABLE [Receipts] (
    [id] bigint NOT NULL PRIMARY KEY IDENTITY (1, 1),
    [receipt_number] nvarchar(30) NOT NULL UNIQUE,
    [generated_at] datetimeoffset NOT NULL,
    [pdf_file] nvarchar(100) NULL,
    [booking_id] bigint NOT NULL UNIQUE
);

ALTER TABLE [Receipts] ADD CONSTRAINT [Receipts_booking_id_ad8a6d14_fk_Bookings_id]
    FOREIGN KEY ([booking_id]) REFERENCES [Bookings] ([id]);
CREATE INDEX [Payments_verified_by_id_d69abad2] ON [Payments] ([verified_by_id]);
CREATE INDEX [Payments_transaction_ref_a8062560] ON [Payments] ([transaction_ref]);
ALTER TABLE [Payments] ADD CONSTRAINT [Payments_booking_id_ae7d11a9_fk_Bookings_id]
    FOREIGN KEY ([booking_id]) REFERENCES [Bookings] ([id]);
ALTER TABLE [Payments] ADD CONSTRAINT [Payments_verified_by_id_d69abad2_fk_AdminUsers_id]
    FOREIGN KEY ([verified_by_id]) REFERENCES [AdminUsers] ([id]);


