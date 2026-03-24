export interface Premise {
  id: number;
  name: string;
  name_mr: string;
  description: string;
  capacity: number;
  base_rent: number;
  security_deposit: number;
  is_active: boolean;
  image_url?: string;
}

export interface TimeSlot {
  id: number;
  premise_id: number;
  name: string;
  start_time: string;
  end_time: string;
  multiplier: number;
}

export interface BookingAvailability {
  date: string;
  premise_id: number;
  booked_slots: number[];
  available_slots: TimeSlot[];
}

export interface BookingSummary {
  premise: Premise;
  dates: string[];
  slot: TimeSlot[];
  total_days: number;
  base_rent: number;
  holiday_charges: number;
  security_deposit: number;
  cgst: number;
  sgst: number;
  total_payable: number;
}

export interface ApplicantDetails {
  full_name: string;
  address: string;
  mobile: string;
  alt_mobile?: string;
  email: string;
  function_name: string;
  function_type: string;
  expected_guests: number;
  id_proof_type: 'aadhaar' | 'pan';
  id_proof_number: string;
  id_proof_file?: File;
}

export interface BankDetails {
  bank_name: string;
  account_holder: string;
  account_number: string;
  ifsc_code: string;
  branch_name: string;
  micr_code: string;
}

export interface Booking {
  id?: number;
  booking_id?: string;
  premise?: Premise;
  from_date: string;
  to_date: string;
  slot?: TimeSlot;
  applicant?: ApplicantDetails;
  bank_details?: BankDetails;
  payment_mode: 'bank_transfer' | 'qr';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  summary?: BookingSummary;
  created_at?: string;
}

export interface CancellationRequest {
  booking_id: string;
  reason: string;
  otp?: string;
}

export interface Complaint {
  name: string;
  email: string;
  mobile: string;
  booking_id?: string;
  subject: string;
  message: string;
}
