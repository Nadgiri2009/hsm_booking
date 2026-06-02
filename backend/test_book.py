import os
import uuid


def main() -> None:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    import django

    django.setup()
    from django.db import IntegrityError

    from apps.bookings.models import Booking
    from apps.premises.models import Premise, TimeSlot

    # Use a unique booking id to avoid UNIQUE constraint collisions when running tests
    p = Premise.objects.first()
    slot = TimeSlot.objects.filter(premise=p).first()
    print("premise", p, slot)
    booking_id = f"TEST-{uuid.uuid4().hex[:8]}"
    try:
        Booking.objects.create(
            booking_id=booking_id,
            from_date="2026-03-01",
            to_date="2026-03-02",
            total_days=1,
            full_name="Test User",
            address="Address",
            mobile="1234567890",
            alt_mobile="0987654321",
            email="test@example.com",
            function_name="Test",
            function_type="Test",
            expected_guests=10,
            id_proof_type="DL",
            id_proof_number="XYZ",
            bank_name="ABC",
            account_holder="User",
            account_number="1234",
            ifsc_code="IFSC",
            branch_name="BR",
            micr_code="MICR",
            base_rent=100,
            holiday_charges=0,
            security_deposit=0,
            cgst=0,
            sgst=0,
            total_payable=100,
            payment_mode="Cash",
            status="pending",
            admin_remarks="",
            premise=p,
            slot=slot,
        )
        print("created booking", booking_id)
    except IntegrityError:
        # If a collision happens (very unlikely with UUID), report and continue
        print("booking unique constraint violated for", booking_id)

    print("count", Booking.objects.count())


if __name__ == "__main__":
    main()
