"""
HSM Booking Business Logic
- Availability checking
- Rent calculation (base rent, holidays, slot multiplier, taxes)
- Booking creation with migration tracking
"""
from decimal import Decimal
from datetime import date, timedelta
from django.conf import settings
from django.db.models import Q
from premises.models import Premise, TimeSlot, Holiday, PremiseRate
from bookings.models import Booking, BookingMigration, Receipt
import logging
import io

logger = logging.getLogger('hsm')


class AvailabilityService:
    @staticmethod
    def get_booked_dates(premise_id: int, slot_id: int = None) -> list:
        """Return list of 'date_slotid' strings that are already booked"""
        qs = Booking.objects.filter(
            premise_id=premise_id,
            status__in=['pending', 'approved'],
        )
        if slot_id:
            qs = qs.filter(slot_id=slot_id)

        booked = set()
        for booking in qs:
            current = booking.start_date
            while current <= booking.end_date:
                if slot_id:
                    booked.add(f"{current.isoformat()}_{booking.slot_id}")
                else:
                    booked.add(current.isoformat())
                current += timedelta(days=1)
        return list(booked)

    @staticmethod
    def is_slot_available(premise_id: int, slot_id: int, start_date: date, end_date: date) -> bool:
        """Check if a slot is free for the given date range"""
        conflicting = Booking.objects.filter(
            premise_id=premise_id,
            slot_id=slot_id,
            status__in=['pending', 'approved'],
        ).filter(
            Q(start_date__lte=end_date) & Q(end_date__gte=start_date)
        )
        return not conflicting.exists()


class RentCalculationService:
    CGST = Decimal(str(settings.HSM_SETTINGS['CGST_RATE']))
    SGST = Decimal(str(settings.HSM_SETTINGS['SGST_RATE']))

    @classmethod
    def calculate(cls, premise_id: int, slot_id: int, start_date: date, end_date: date) -> dict:
        premise = Premise.objects.get(id=premise_id)
        slot = TimeSlot.objects.get(id=slot_id)

        total_days = (end_date - start_date).days + 1
        holidays = Holiday.objects.filter(date__gte=start_date, date__lte=end_date)
        holiday_dates = {h.date: h for h in holidays}

        base_rent = Decimal('0')
        holiday_charges = Decimal('0')

        current = start_date
        while current <= end_date:
            day_rate = premise.base_rate
            if current in holiday_dates:
                multiplier = holiday_dates[current].charge_multiplier
                holiday_rate = day_rate * Decimal(str(multiplier)) - day_rate
                holiday_charges += holiday_rate
            # Apply weekend rate if applicable
            if current.weekday() >= 5:  # Saturday/Sunday
                weekend_rates = PremiseRate.objects.filter(
                    premise=premise,
                    rate_type='weekend',
                    effective_from__lte=current,
                    is_active=True,
                ).filter(Q(effective_to__isnull=True) | Q(effective_to__gte=current)).first()
                if weekend_rates:
                    day_rate = weekend_rates.amount
            base_rent += day_rate
            current += timedelta(days=1)

        # Slot multiplier
        slot_additional = base_rent * (Decimal(str(slot.multiplier)) - 1)
        base_rent_with_slot = base_rent + slot_additional

        subtotal = base_rent_with_slot + holiday_charges + premise.security_deposit
        cgst = base_rent_with_slot * cls.CGST
        sgst = base_rent_with_slot * cls.SGST
        total_payable = subtotal + cgst + sgst

        return {
            'total_days': total_days,
            'base_rent': float(base_rent),
            'slot_charges': float(slot_additional),
            'holiday_charges': float(holiday_charges),
            'security_deposit': float(premise.security_deposit),
            'subtotal': float(subtotal),
            'cgst': float(cgst),
            'sgst': float(sgst),
            'total_payable': float(total_payable),
        }


class RefundCalculationService:
    POLICY = settings.HSM_SETTINGS['REFUND_POLICY']

    @classmethod
    def calculate_refund(cls, booking: Booking) -> dict:
        days_until_event = (booking.start_date - date.today()).days

        if days_until_event >= 60:
            refund_percent = cls.POLICY['60_DAYS']
            policy_label = 'More than 2 months — 90% refund'
        elif days_until_event >= 30:
            refund_percent = cls.POLICY['30_DAYS']
            policy_label = 'More than 1 month — 80% refund'
        elif days_until_event >= 7:
            refund_percent = cls.POLICY['7_DAYS']
            policy_label = '7+ days — 50% refund'
        else:
            refund_percent = cls.POLICY['LESS_7_DAYS']
            policy_label = 'Less than 7 days — Security deposit only'

        refundable_amount = booking.total_payable - booking.security_deposit
        refund_amount = Decimal(str(refundable_amount)) * Decimal(str(refund_percent))

        if refund_percent == 0:
            refund_amount = booking.security_deposit

        return {
            'days_until_event': days_until_event,
            'refund_percentage': refund_percent * 100,
            'refund_amount': float(refund_amount),
            'policy': policy_label,
        }


class ReceiptGeneratorService:
    @staticmethod
    def generate_pdf(booking: Booking) -> io.BytesIO:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.units import inch

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph('<b>Solapur Municipal Corporation</b>', styles['Title']))
        story.append(Paragraph('Hutatma Smruti Mandir — Booking Receipt', styles['Heading2']))
        story.append(Spacer(1, 12))

        # Booking Info Table
        data = [
            ['Booking ID', booking.booking_id, 'Date', booking.created_at.strftime('%d/%m/%Y')],
            ['Premise', booking.premise.name, 'Status', booking.status.upper()],
            ['Start Date', booking.start_date.strftime('%d/%m/%Y'), 'End Date', booking.end_date.strftime('%d/%m/%Y')],
            ['Total Days', str(booking.total_days), 'Slot', booking.slot.name if booking.slot else 'N/A'],
        ]
        table = Table(data, colWidths=[1.5*inch, 2.5*inch, 1.2*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a4b8c')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f7fa')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f5f7fa')),
        ]))
        story.append(table)
        story.append(Spacer(1, 12))

        # Applicant
        story.append(Paragraph('<b>Applicant Details</b>', styles['Heading3']))
        applicant_data = [
            ['Name', booking.applicant_name, 'Mobile', booking.mobile],
            ['Email', booking.email, 'Function', booking.function_name],
            ['Guests', str(booking.guest_count), 'Function Type', booking.function_type],
        ]
        tbl2 = Table(applicant_data, colWidths=[1.5*inch, 2.5*inch, 1.2*inch, 2*inch])
        tbl2.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f5f7fa')),
            ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#f5f7fa')),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
        ]))
        story.append(tbl2)
        story.append(Spacer(1, 12))

        # Payment breakdown
        story.append(Paragraph('<b>Payment Breakdown</b>', styles['Heading3']))
        pay_data = [
            ['Description', 'Amount (₹)'],
            ['Base Rent', f'{booking.base_rent:,.2f}'],
            ['Slot Charges', f'{booking.slot_charges:,.2f}'],
            ['Holiday Charges', f'{booking.holiday_charges:,.2f}'],
            ['Security Deposit', f'{booking.security_deposit:,.2f}'],
            ['CGST (9%)', f'{booking.cgst:,.2f}'],
            ['SGST (9%)', f'{booking.sgst:,.2f}'],
            ['TOTAL PAYABLE', f'{booking.total_payable:,.2f}'],
        ]
        tbl3 = Table(pay_data, colWidths=[5*inch, 2.25*inch])
        tbl3.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a4b8c')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#fff3e0')),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ]))
        story.append(tbl3)

        story.append(Spacer(1, 20))
        story.append(Paragraph('<i>This is a computer-generated receipt. | Solapur Municipal Corporation</i>', styles['Normal']))

        doc.build(story)
        buffer.seek(0)
        return buffer
