const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const swaggerUi = require("swagger-ui-express");

const env = require("./config/env");
const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const computerRoutes = require("./routes/computers.routes");
const bookingRoutes = require("./routes/bookings.routes");
const openApiDocument = require("./docs/openapi");
const { notFoundHandler, errorHandler } = require("./middleware/error.middleware");

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/computers", computerRoutes);
app.use("/bookings", bookingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
