const { z } = require("zod");

const { TIME_SLOTS, DATE_ONLY_REGEX } = require("../utils/time-slots");

const positivePageSchema = z.coerce.number().int().min(1).default(1);
const positivePageSizeSchema = z.coerce.number().int().min(1).max(100).default(10);

const createBookingSchema = z.object({
  userId: z.string().uuid(),
  computerId: z.coerce.number().int().positive(),
  date: z.string().regex(DATE_ONLY_REGEX, "Date must be in YYYY-MM-DD format."),
  timeSlot: z.enum(TIME_SLOTS),
});

const listBookingsQuerySchema = z.object({
  userId: z.string().uuid(),
  page: positivePageSchema.optional(),
  pageSize: positivePageSizeSchema.optional(),
});

const cancelBookingQuerySchema = z.object({
  userId: z.string().uuid(),
});

const bookingIdParamSchema = z.object({
  id: z.string().uuid(),
});

module.exports = {
  createBookingSchema,
  listBookingsQuerySchema,
  cancelBookingQuerySchema,
  bookingIdParamSchema,
};
