const authService = require("../services/auth.service");
const { success } = require("../utils/response");

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body);
    return res.status(201).json(success("User created successfully.", result));
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(success("Login successful.", result));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  signup,
  login,
};
