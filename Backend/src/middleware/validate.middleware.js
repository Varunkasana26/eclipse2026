const AppError = require("../utils/app-error");

function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      return next(
        new AppError("Validation failed.", 400, result.error.flatten())
      );
    }

    req[target] = result.data;
    return next();
  };
}

module.exports = validate;
