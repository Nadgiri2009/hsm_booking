// Premise Models
export interface Premise {
  id: number;
  name: string;
  description: string;
  capacity: number;
  baseRate: number;
  securityDeposit: number;
  icon?: string;
  isAvailable: boolean;
  images?: string[];
}

export interface PremiseRate {
  id: number;
  premiseId: number;
  rateType: 'weekday' | 'weekend' | 'holiday';
  amount: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface TimeSlot {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  multiplier: number;
  isActive: boolean;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  chargeMultiplier: number;
}

// Booking Models
export interface Booking {
  id: number;
  bookingId: string;
  premiseId: number;
  premiseName?: string;
  startDate: string;
  endDate: string;
  slotId: number;
  slotName?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  applicantName: string;
  mobile: string;
  email: string;
  functionName: string;
  functionType: string;
  guestCount: number;
  totalPayable: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'partial';
  createdAt: string;
}

export interface BookingCalculation {
  totalDays: number;
  baseRent: number;
  holidayCharges: number;
  slotCharge: number;
  securityDeposit: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalPayable: number;
}

export interface CreateBookingPayload {
  premiseId: number;
  startDate: string;
  endDate: string;
  slotId: number;
  applicant: ApplicantDetails;
  bankDetails: BankDetails;
  paymentMode: 'bank_transfer' | 'qr_payment';
}

export interface ApplicantDetails {
  name: string;
  address: string;
  mobile: string;
  altMobile?: string;
  email: string;
  functionName: string;
  functionType: string;
  guestCount: number;
  details?: string;
  idProofType: string;
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  micr?: string;
}

// Payment Models
export interface Payment {
  id: number;
  bookingId: string;
  amount: number;
  mode: string;
  transactionId?: string;
  status: 'pending' | 'success' | 'failed';
  paidAt?: string;
  receiptNumber?: string;
}

// Cancellation Models
export interface Cancellation {
  id: number;
  bookingId: string;
  reason: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  refundAmount?: number;
  refundStatus?: 'pending' | 'processed';
  otp?: string;
}

// Complaint Models
export interface Complaint {
  id: number;
  name: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}

// Admin Models
export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  pendingBookings: number;
  totalCancellations: number;
  totalComplaints: number;
  monthlyRevenue: number[];
  bookingsByPremise: { name: string; count: number }[];
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
