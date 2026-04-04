const { Prisma } = require("@prisma/client");

jest.mock("../src/db/prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
  computer: {
    findUnique: jest.fn(),
  },
  booking: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

const prisma = require("../src/db/prisma");
const bookingService = require("../src/services/bookings.service");

describe("booking service rules", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("prevents double booking for the same computer, date, and time slot", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "550e8400-e29b-41d4-a716-446655440000" });
    prisma.computer.findUnique.mockResolvedValue({ id: 1, active: true });
    prisma.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      userId: "other-user-id",
      computerId: 1,
      date: new Date("2026-04-10T00:00:00.000Z"),
      timeSlot: "10:00-11:00",
      status: "ACTIVE",
    });

    await expect(
      bookingService.createBooking({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        computerId: 1,
        date: "2026-04-10",
        timeSlot: "10:00-11:00",
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "This computer is already booked for the selected date and time slot.",
    });
  });

  test("prevents cancelling another user's booking", async () => {
    prisma.booking.findUnique.mockResolvedValue({
      id: "booking-1",
      userId: "owner-id",
      status: "ACTIVE",
    });

    await expect(
      bookingService.cancelBooking("booking-1", "different-user-id")
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You can cancel only your own booking.",
    });
  });

  test("returns a conflict when a concurrent create hits the database unique constraint", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "550e8400-e29b-41d4-a716-446655440000" });
    prisma.computer.findUnique.mockResolvedValue({ id: 1, active: true });
    prisma.booking.findUnique.mockResolvedValue(null);
    prisma.booking.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed.", {
        code: "P2002",
        clientVersion: "6.5.0",
      })
    );

    await expect(
      bookingService.createBooking({
        userId: "550e8400-e29b-41d4-a716-446655440000",
        computerId: 1,
        date: "2026-04-10",
        timeSlot: "10:00-11:00",
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "This computer is already booked for the selected date and time slot.",
    });
  });
});
