const AppError = require("../utils/app-error");
const authService = require("../services/auth.service");

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authorization token is required.", 401);
    }

    const token = authHeader.split(" ")[1];
    req.user = await authService.getAuthenticatedUser(token);

    return next();
  } catch (error) {
    return next(
      error instanceof AppError
        ? error
        : new AppError("Invalid or expired Supabase access token.", 401)
    );
  }
}

module.exports = {
  authenticate,
};
