const express = require("express");

const bookingsController = require("../controllers/bookings.controller");
const validate = require("../middleware/validate.middleware");
const {
  createBookingSchema,
  listBookingsQuerySchema,
  cancelBookingQuerySchema,
  bookingIdParamSchema,
} = require("../validators/booking.validators");

const router = express.Router();

router.get("/", validate(listBookingsQuerySchema, "query"), bookingsController.getBookings);
router.post("/", validate(createBookingSchema), bookingsController.createBooking);
router.delete(
  "/:id",
  validate(bookingIdParamSchema, "params"),
  validate(cancelBookingQuerySchema, "query"),
  bookingsController.cancelBooking
);

module.exports = router;
