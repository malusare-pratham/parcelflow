const { z } = require('zod');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id.');
const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number.');
const shortText = (name, max = 120) => z.string().trim().min(1, `${name} is required.`).max(max);
const optionalReason = z.string().trim().max(500).optional().nullable();

const registerSchema = z.object({
  name: shortText('Name', 100),
  phone,
  email: z.union([z.string().trim().email(), z.literal(''), z.undefined(), z.null()]).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  role: z.enum(['customer', 'driver']).optional(),
});

const loginSchema = z.object({
  phone,
  password: z.string().min(1, 'Password is required.').max(128),
});

const verifyOtpSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, 'OTP must be 6 digits.'),
});

const tripSearchSchema = z.object({
  from: z.string().trim().max(80).optional(),
  to: z.string().trim().max(80).optional(),
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD.').optional(),
});

const createTripSchema = z.object({
  from: z.string().trim().max(80).optional(),
  origin: z.string().trim().max(80).optional(),
  to: z.string().trim().max(80).optional(),
  destination: z.string().trim().max(80).optional(),
  pickupLocation: z.string().trim().max(300).optional(),
  pickup_location: z.string().trim().max(300).optional(),
  pickup: z.string().trim().max(300).optional(),
  dropLocation: z.string().trim().max(300).optional(),
  dropOffLocation: z.string().trim().max(300).optional(),
  dropoffLocation: z.string().trim().max(300).optional(),
  drop: z.string().trim().max(300).optional(),
  date: z.string().trim().min(1, 'Date is required.'),
  time: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm.'),
  arrivalTime: z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Arrival time must be HH:mm.').optional().or(z.literal('')),
  capacity: z.coerce.number().min(1).max(10000),
  pricePerKg: z.coerce.number().min(0).max(100000).optional(),
  pricePerSlot: z.coerce.number().min(0).max(100000).optional(),
  notes: z.string().trim().max(500).optional(),
});

const uploadDocsSchema = z.object({
  vehicleNumber: shortText('Vehicle number', 30),
  vehicleType: z.enum(['bike', 'auto', 'car', 'van', 'truck']),
  vehicleName: shortText('Vehicle name', 80),
  vehicleColor: shortText('Vehicle color', 40),
});

const driverTripStatusSchema = z.object({
  status: z.enum(['cancelled', 'completed']),
});

const bookingStatusSchema = z.object({
  status: z.enum(['picked', 'in-transit', 'delivered']),
});

const bookingDecisionSchema = z.object({
  decision: z.enum(['confirmed', 'rejected']),
  rejectionReason: optionalReason,
});

const adminDriverVerifySchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: optionalReason,
});

const adminTripStatusSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: optionalReason,
});

const cancelBookingSchema = z.object({
  reason: z.string().trim().max(300).optional(),
});

const createBookingSchema = z.object({
  tripId: objectId,
  parcelDetails: z.object({
    description: shortText('Parcel description', 500),
    weight: z.coerce.number().min(0.1).max(10000),
    receiverName: shortText('Receiver name', 100),
    receiverPhone: phone,
    deliveryAddress: shortText('Delivery address', 500),
  }),
});

const idParamSchema = z.object({ id: objectId });

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  tripSearchSchema,
  createTripSchema,
  uploadDocsSchema,
  driverTripStatusSchema,
  bookingStatusSchema,
  bookingDecisionSchema,
  adminDriverVerifySchema,
  adminTripStatusSchema,
  cancelBookingSchema,
  createBookingSchema,
  idParamSchema,
};
