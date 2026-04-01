const bookingService = require("../services/bookings.service");
const { success } = require("../utils/response");

async function getBookings(req, res, next) {
  try {
    const result = await bookingService.listBookings(req.query);
    return res.status(200).json(success("Bookings fetched successfully.", result));
  } catch (error) {
    return next(error);
  }
}

async function createBooking(req, res, next) {
  try {
    const booking = await bookingService.createBooking(req.body);
    return res.status(201).json(success("Booking created successfully.", booking));
  } catch (error) {
    return next(error);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await bookingService.cancelBooking(req.params.id, req.query.userId);
    return res
      .status(200)
      .json(success("Booking cancelled successfully.", {
        id: booking.id,
        status: booking.status,
      }));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getBookings,
  createBooking,
  cancelBooking,
};
