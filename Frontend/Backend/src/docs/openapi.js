module.exports = {
  openapi: "3.0.3",
  info: {
    title: "Computer Lab Booking API",
    version: "1.0.0",
    description: "REST API for managing computers, availability, bookings, and auth.",
  },
  servers: [
    {
      url: "http://localhost:5000",
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Computers" },
    { name: "Bookings" },
  ],
  components: {
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed." },
          details: {
            type: "object",
            additionalProperties: true,
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Server is healthy." },
          data: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              environment: { type: "string", example: "development" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
      SignupRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Aarav Sharma" },
          email: { type: "string", example: "aarav@example.com" },
          password: { type: "string", example: "password123" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "aarav@example.com" },
          password: { type: "string", example: "password123" },
        },
      },
      BookingRequest: {
        type: "object",
        required: ["userId", "computerId", "date", "timeSlot"],
        properties: {
          userId: { type: "string", format: "uuid" },
          computerId: { type: "integer", example: 1 },
          date: { type: "string", example: "2026-04-10" },
          timeSlot: { type: "string", example: "10:00-11:00" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful." },
          data: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string", format: "uuid" },
                  name: { type: "string", example: "Aarav Sharma" },
                  email: { type: "string", example: "aarav@example.com" },
                  createdAt: { type: "string", format: "date-time" },
                },
              },
              session: {
                type: "object",
                nullable: true,
                properties: {
                  accessToken: { type: "string", example: "supabase-access-token" },
                  refreshToken: { type: "string", example: "supabase-refresh-token" },
                  expiresAt: { type: "integer", example: 1775041800 },
                  expiresIn: { type: "integer", example: 3600 },
                  tokenType: { type: "string", example: "bearer" },
                },
              },
              requiresEmailConfirmation: { type: "boolean", example: false },
            },
          },
        },
      },
      PaginatedComputersResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Computers fetched successfully." },
          data: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    name: { type: "string", example: "Lab-A-01" },
                    location: { type: "string", example: "Main Lab" },
                    description: { type: "string", example: "High performance workstation" },
                    active: { type: "boolean", example: true },
                    createdAt: { type: "string", format: "date-time" },
                    updatedAt: { type: "string", format: "date-time" },
                  },
                },
              },
              meta: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  pageSize: { type: "integer", example: 10 },
                  totalItems: { type: "integer", example: 12 },
                  totalPages: { type: "integer", example: 2 },
                },
              },
            },
          },
        },
      },
      AvailabilityResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Computer availability fetched successfully." },
          data: {
            type: "object",
            properties: {
              computer: {
                type: "object",
                properties: {
                  id: { type: "integer", example: 1 },
                  name: { type: "string", example: "Lab-A-01" },
                  location: { type: "string", example: "Main Lab" },
                  description: { type: "string", example: "High performance workstation" },
                  active: { type: "boolean", example: true },
                },
              },
              date: { type: "string", example: "2026-04-10" },
              timeSlots: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    slot: { type: "string", example: "10:00-11:00" },
                    isBooked: { type: "boolean", example: true },
                  },
                },
              },
            },
          },
        },
      },
      PaginatedBookingsResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Bookings fetched successfully." },
          data: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string", format: "uuid" },
                    userId: { type: "string", format: "uuid" },
                    computerId: { type: "integer", example: 1 },
                    date: { type: "string", example: "2026-04-10" },
                    timeSlot: { type: "string", example: "10:00-11:00" },
                    status: { type: "string", example: "ACTIVE" },
                    computer: {
                      type: "object",
                      properties: {
                        id: { type: "integer", example: 1 },
                        name: { type: "string", example: "Lab-A-01" },
                        location: { type: "string", example: "Main Lab" },
                      },
                    },
                  },
                },
              },
              meta: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  pageSize: { type: "integer", example: 10 },
                  totalItems: { type: "integer", example: 1 },
                  totalPages: { type: "integer", example: 1 },
                },
              },
            },
          },
        },
      },
      BookingResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Booking created successfully." },
          data: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              userId: { type: "string", format: "uuid" },
              computerId: { type: "integer", example: 1 },
              date: { type: "string", example: "2026-04-10" },
              timeSlot: { type: "string", example: "10:00-11:00" },
              status: { type: "string", example: "ACTIVE" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      BookingCancellationResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Booking cancelled successfully." },
          data: {
            type: "object",
            properties: {
              id: { type: "string", format: "uuid" },
              status: { type: "string", example: "CANCELLED" },
            },
          },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Get service health",
        responses: {
          200: {
            description: "Health status",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/auth/signup": {
      post: {
        tags: ["Auth"],
        summary: "Create a user account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SignupRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          409: {
            description: "Email already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          200: {
            description: "Logged in",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" },
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/computers": {
      get: {
        tags: ["Computers"],
        summary: "List active computers",
        parameters: [
          { in: "query", name: "page", schema: { type: "integer", example: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", example: 10 } },
        ],
        responses: {
          200: {
            description: "Computers returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedComputersResponse" },
              },
            },
          },
        },
      },
    },
    "/computers/{id}/availability": {
      get: {
        tags: ["Computers"],
        summary: "Get availability for a computer on a date",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "integer" } },
          { in: "query", name: "date", required: true, schema: { type: "string", example: "2026-04-10" } },
        ],
        responses: {
          200: {
            description: "Availability returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AvailabilityResponse" },
              },
            },
          },
          404: {
            description: "Computer not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "List bookings for a user",
        parameters: [
          { in: "query", name: "userId", required: true, schema: { type: "string", format: "uuid" } },
          { in: "query", name: "page", schema: { type: "integer", example: 1 } },
          { in: "query", name: "pageSize", schema: { type: "integer", example: 10 } },
        ],
        responses: {
          200: {
            description: "Bookings returned",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PaginatedBookingsResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Bookings"],
        summary: "Create a booking",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/BookingRequest" },
            },
          },
        },
        responses: {
          201: {
            description: "Booking created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingResponse" },
              },
            },
          },
          409: {
            description: "Duplicate booking conflict",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/bookings/{id}": {
      delete: {
        tags: ["Bookings"],
        summary: "Cancel a booking",
        parameters: [
          { in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } },
          { in: "query", name: "userId", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "Booking cancelled",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/BookingCancellationResponse" },
              },
            },
          },
          403: {
            description: "Not the owner",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
  },
};
