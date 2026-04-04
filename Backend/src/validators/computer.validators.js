const { z } = require("zod");

const { DATE_ONLY_REGEX } = require("../utils/time-slots");

const listComputersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

const availabilityQuerySchema = z.object({
  date: z.string().regex(DATE_ONLY_REGEX, "Date must be in YYYY-MM-DD format."),
});

const computerIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = {
  listComputersQuerySchema,
  availabilityQuerySchema,
  computerIdParamSchema,
};
