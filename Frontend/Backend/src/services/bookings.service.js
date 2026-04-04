const { Prisma } = require("@prisma/client");
const prisma = require("../db/prisma");

const AppError = require("../utils/app-error");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const { toDateOnlyUtc, formatDateOnly } = require("../utils/time-slots");

async function listBookings(query) {
  const { page, pageSize, skip } = getPagination(query.page, query.pageSize);

  const [items, totalItems] = await Promise.all([
    prisma.booking.findMany({
      where: {
        userId: query.userId,
      },
      include: {
        computer: {
          select: {
            id: true,
            name: true,
            location: true,
          },
        },
      },
      orderBy: [
        { date: "asc" },
        { timeSlot: "asc" },
      ],
      skip,
      take: pageSize,
    }),
    prisma.booking.count({
      where: {
        userId: query.userId,
      },
    }),
  ]);

  return {
    items: items.map(mapBookingResponse),
    meta: buildPaginationMeta({ page, pageSize, totalItems }),
  };
}

async function createBooking(payload) {
  const bookingDate = toDateOnlyUtc(payload.date);

  const [user, computer, existingBooking] = await Promise.all([
    prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true },
    }),
    prisma.computer.findUnique({
      where: { id: payload.computerId },
      select: { id: true, active: true },
    }),
    prisma.booking.findUnique({
      where: {
        computerId_date_timeSlot: {
          computerId: payload.computerId,
          date: bookingDate,
          timeSlot: payload.timeSlot,
        },
      },
    }),
  ]);

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  if (!computer || !computer.active) {
    throw new AppError("Computer not found.", 404);
  }

  if (existingBooking && existingBooking.status === "ACTIVE") {
    throw new AppError(
      "This computer is already booked for the selected date and time slot.",
      409
    );
  }

  if (existingBooking && existingBooking.status === "CANCELLED") {
    const updatedBooking = await prisma.booking.update({
      where: { id: existingBooking.id },
      data: {
        userId: payload.userId,
        status: "ACTIVE",
      },
    });

    return mapBookingResponse(updatedBooking);
  }

  let booking;

  try {
    booking = await prisma.booking.create({
      data: {
        userId: payload.userId,
        computerId: payload.computerId,
        date: bookingDate,
        timeSlot: payload.timeSlot,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError(
        "This computer is already booked for the selected date and time slot.",
        409
      );
    }

    throw error;
  }

  return mapBookingResponse(booking);
}

async function cancelBooking(bookingId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    throw new AppError("Booking not found.", 404);
  }

  if (booking.userId !== userId) {
    throw new AppError("You can cancel only your own booking.", 403);
  }

  if (booking.status === "CANCELLED") {
    throw new AppError("Booking is already cancelled.", 409);
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
    },
  });
}

function mapBookingResponse(booking) {
  return {
    ...booking,
    date: formatDateOnly(booking.date),
  };
}

module.exports = {
  listBookings,
  createBooking,
  cancelBooking,
};
