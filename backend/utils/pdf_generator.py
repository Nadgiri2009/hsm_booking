"""PDF Receipt Generator using ReportLab"""

import io
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

from django.utils import timezone
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import HRFlowable, Image, KeepInFrame, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OFFICE_ADDRESS = 'Indrabhavan, Ambedkar Chowk, Solapur-413001'


def _as_decimal(value):
    try:
        return Decimal(str(value or '0'))
    except (InvalidOperation, TypeError, ValueError):
        return Decimal('0')


def _format_currency(value):
    return f"Rs. {_as_decimal(value):.2f}"


def _to_words_under_thousand(number):
    ones = [
        '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
        'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
    ]
    tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

    parts = []
    hundreds = number // 100
    remainder = number % 100

    if hundreds:
        parts.append(f"{ones[hundreds]} hundred")

    if remainder:
        if remainder < 20:
            parts.append(ones[remainder])
        else:
            t = remainder // 10
            o = remainder % 10
            parts.append(tens[t] + (f" {ones[o]}" if o else ''))

    return ' '.join(parts).strip()


def _number_to_indian_words(number):
    if number == 0:
        return 'zero'

    chunks = [
        (10000000, 'crore'),
        (100000, 'lakh'),
        (1000, 'thousand'),
    ]

    words = []
    balance = number
    for divider, label in chunks:
        unit = balance // divider
        if unit:
            words.append(f"{_to_words_under_thousand(unit)} {label}")
            balance = balance % divider

    if balance:
        words.append(_to_words_under_thousand(balance))

    return ' '.join(part for part in words if part).strip()


def _amount_in_words(value):
    rounded_value = int(_as_decimal(value).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    words = _number_to_indian_words(rounded_value).title()
    return f"Rupees {words} Only"


def _format_date(value):
    if not value:
        return '-'
    return value.strftime('%d-%m-%Y')


def _format_time(value):
    if not value:
        return '-'
    return value.strftime('%I.%M %p').lower()


def _find_logo_path():
    root = Path(__file__).resolve().parents[2]
    candidates = [
        root / 'frontend' / 'src' / 'assets' / 'SMC.png',
        root / 'frontend' / 'dist' / 'hsm-booking' / 'assets' / 'SMC.png',
    ]
    for candidate in candidates:
        if candidate.exists():
            return str(candidate)
    return None


def _section_table(title, rows, width):
    data = [[title, '']]
    data.extend(rows)

    table = Table(data, colWidths=[width * 0.33, width * 0.67])
    table.setStyle(TableStyle([
        ('SPAN', (0, 0), (-1, 0)),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#efefef')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, 0), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#222222')),
        ('GRID', (0, 0), (-1, -1), 0.8, colors.HexColor('#555555')),
        ('LEFTPADDING', (0, 0), (-1, -1), 7),
        ('RIGHTPADDING', (0, 0), (-1, -1), 7),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return table


def generate_receipt_pdf(booking):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.2 * cm,
        leftMargin=1.2 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.2 * cm,
    )

    styles = getSampleStyleSheet()
    centered = ParagraphStyle('centered', parent=styles['Normal'], alignment=TA_CENTER)
    title_style = ParagraphStyle('title', parent=centered, fontName='Helvetica-Bold', fontSize=11)
    subtitle_style = ParagraphStyle('subtitle', parent=centered, fontName='Helvetica-Bold', fontSize=10)
    normal_center = ParagraphStyle('normal_center', parent=centered, fontSize=9)

    receipt_content = []
    logo_path = _find_logo_path()
    header_block = []
    if logo_path:
        header_block.append(Image(logo_path, width=2.0 * cm, height=2.0 * cm))
        header_block.append(Spacer(1, 0.1 * cm))
    header_block.extend([
        Paragraph('Solapur Municipal Corporation', title_style),
        Paragraph('Auditorium Booking Receipt', subtitle_style),
    ])

    header_table = Table([[header_block]], colWidths=[doc.width])
    header_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.0, colors.HexColor('#555555')),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    receipt_content.append(header_table)
    receipt_content.append(Spacer(1, 0.5 * cm))

    receipt_number = f"RCPT-{booking.booking_id}"
    slot_window = f"{_format_time(booking.slot.start_time)} - {_format_time(booking.slot.end_time)}"
    date_range = f"{_format_date(booking.from_date)} to {_format_date(booking.to_date)}"

    payment = getattr(booking, 'payment', None)
    transaction_id = payment.transaction_ref if payment and payment.transaction_ref else '-'
    payment_mode = (
        payment.payment_mode if payment and payment.payment_mode else booking.payment_mode
    )
    payment_mode = (payment_mode or '-').replace('_', ' ').title()

    gst_amount = _as_decimal(booking.cgst) + _as_decimal(booking.sgst)
    total_paid = _as_decimal(booking.total_payable)
    base_excluding_gst = total_paid - gst_amount

    applicant_rows = [
        ['Applicant Name', booking.full_name],
        ['Mobile Number', booking.mobile],
        ['Email ID', booking.email],
        ['Address', booking.address],
        ['Refund Bank Name', booking.bank_name],
        ['Refund A/C Number', booking.account_number],
        ['Refund A/C Name', booking.account_holder],
        ['Refund IFSC', booking.ifsc_code],
    ]

    booking_rows = [
        ['Receipt Number', receipt_number],
        ['Booking ID', booking.booking_id],
        ['Booking Date', _format_date(booking.created_at)],
        ['Premise Name', booking.premise.name],
        ['Auditorium Address', OFFICE_ADDRESS],
        ['Date Range', date_range],
        ['Time Slot', slot_window],
        ['Purpose', booking.function_name],
        ['Booking Status', booking.status.title()],
    ]

    payment_rows = [
        ['Transaction ID', transaction_id],
        ['Payment Mode', payment_mode],
        ['Base Charges (Excl. GST)', _format_currency(base_excluding_gst)],
        ['GST Amount', _format_currency(gst_amount)],
        ['Total Amount Paid', _format_currency(total_paid)],
        ['Total Amount (Words)', _amount_in_words(total_paid)],
    ]

    receipt_content.append(_section_table('Applicant Details', applicant_rows, doc.width))
    receipt_content.append(Spacer(1, 0.4 * cm))
    receipt_content.append(_section_table('Booking Details', booking_rows, doc.width))
    receipt_content.append(Spacer(1, 0.4 * cm))
    receipt_content.append(_section_table('Payment Summary', payment_rows, doc.width))
    receipt_content.append(Spacer(1, 0.4 * cm))

    terms_rows = [
        [' ', 'Booking is subject to SMC terms and conditions.'],
        [' ', 'This is a system-generated receipt and does not require physical signature.'],
    ]
    receipt_content.append(_section_table('Terms & Notes', terms_rows, doc.width))
    receipt_content.append(Spacer(1, 0.25 * cm))

    receipt_content.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#555555')))
    receipt_content.append(Spacer(1, 0.2 * cm))
    receipt_content.append(Paragraph('System Generated Receipt (No Signature Required)', ParagraphStyle('footer_title', parent=centered, fontName='Helvetica-Bold', fontSize=9)))
    receipt_content.append(Paragraph('Official Contact Details', ParagraphStyle('footer_subtitle', parent=centered, fontName='Helvetica-Bold', fontSize=9)))
    receipt_content.append(Paragraph(f'hsm@solapurcorporation.gov.in, {OFFICE_ADDRESS}', normal_center))
    generated_on = timezone.localtime()
    receipt_content.append(Paragraph(f"Generated On: {generated_on.strftime('%m/%d/%Y, %I:%M:%S %p')}", normal_center))

    story = [KeepInFrame(doc.width, doc.height, receipt_content, mode='shrink')]

    doc.build(story)
    buffer.seek(0)
    return buffer
