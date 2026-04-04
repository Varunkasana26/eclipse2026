const prisma = require("../db/prisma");

const AppError = require("../utils/app-error");
const { getPagination, buildPaginationMeta } = require("../utils/pagination");
const { DATE_ONLY_REGEX, TIME_SLOTS, toDateOnlyUtc, formatDateOnly } = require("../utils/time-slots");

async function listComputers(query) {
  const { page, pageSize, skip } = getPagination(query.page, query.pageSize);

  const [items, totalItems] = await Promise.all([
    prisma.computer.findMany({
      where: { active: true },
      orderBy: { id: "asc" },
      skip,
      take: pageSize,
    }),
    prisma.computer.count({
      where: { active: true },
    }),
  ]);

  return {
    items,
    meta: buildPaginationMeta({ page, pageSize, totalItems }),
  };
}

async function getComputerAvailability(computerId, date) {
  if (!DATE_ONLY_REGEX.test(date)) {
    throw new AppError("Date must be in YYYY-MM-DD format.", 400);
  }

  const parsedComputerId = Number(computerId);

  const computer = await prisma.computer.findUnique({
    where: { id: parsedComputerId },
    select: {
      id: true,
      name: true,
      location: true,
      description: true,
      active: true,
    },
  });

  if (!computer || !computer.active) {
    throw new AppError("Computer not found.", 404);
  }

  const bookings = await prisma.booking.findMany({
    where: {
      computerId: parsedComputerId,
      date: toDateOnlyUtc(date),
      status: "ACTIVE",
    },
    select: {
      timeSlot: true,
    },
  });

  const bookedSlots = new Set(bookings.map((booking) => booking.timeSlot));

  return {
    computer,
    date: formatDateOnly(toDateOnlyUtc(date)),
    timeSlots: TIME_SLOTS.map((slot) => ({
      slot,
      isBooked: bookedSlots.has(slot),
    })),
  };
}

module.exports = {
  listComputers,
  getComputerAvailability,
};
