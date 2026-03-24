-- WARNING: Destructive. BACKUP your database before running.
-- This script drops legacy hsm_ tables and related objects introduced
-- by the older system. It runs in a transaction and will roll back on error.

BEGIN TRY
    BEGIN TRANSACTION;

    -- Drop dependent tables first
    IF OBJECT_ID(N'dbo.hsm_receipts', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_receipts;

    IF OBJECT_ID(N'dbo.hsm_cancellations', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_cancellations;

    IF OBJECT_ID(N'dbo.hsm_complaints', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_complaints;

    IF OBJECT_ID(N'dbo.hsm_bookings', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_bookings;

    IF OBJECT_ID(N'dbo.hsm_booking_migrations', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_booking_migrations;

    IF OBJECT_ID(N'dbo.hsm_gallery', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_gallery;

    IF OBJECT_ID(N'dbo.hsm_time_slots', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_time_slots;

    IF OBJECT_ID(N'dbo.hsm_premise_rates', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_premise_rates;

    IF OBJECT_ID(N'dbo.hsm_premises', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_premises;

    IF OBJECT_ID(N'dbo.hsm_admin_users', 'U') IS NOT NULL
        DROP TABLE dbo.hsm_admin_users;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    DECLARE @ErrMsg nvarchar(4000) = ERROR_MESSAGE();
    DECLARE @ErrNo int = ERROR_NUMBER();
    RAISERROR('Error dropping hsm_ tables: %s (Error %d)', 16, 1, @ErrMsg, @ErrNo);
END CATCH;

-- Notes:
-- 1) This script assumes the legacy tables live in the dbo schema.
-- 2) If your environment uses a different schema, update the object names.
-- 3) Running this is irreversible without a backup. Create a full DB backup first.
-- Example run (sqlcmd):
-- sqlcmd -S <SERVER> -d <DATABASE> -U <USER> -P <PASS> -i database_drop_hsm.sql
