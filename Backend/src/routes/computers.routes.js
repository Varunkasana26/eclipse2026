const express = require("express");

const computersController = require("../controllers/computers.controller");
const validate = require("../middleware/validate.middleware");
const {
  listComputersQuerySchema,
  availabilityQuerySchema,
  computerIdParamSchema,
} = require("../validators/computer.validators");

const router = express.Router();

router.get("/", validate(listComputersQuerySchema, "query"), computersController.getComputers);
router.get(
  "/:id/availability",
  validate(computerIdParamSchema, "params"),
  validate(availabilityQuerySchema, "query"),
  computersController.getAvailability
);

module.exports = router;
