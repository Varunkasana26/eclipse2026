const computerService = require("../services/computers.service");
const { success } = require("../utils/response");

async function getComputers(req, res, next) {
  try {
    const result = await computerService.listComputers(req.query);
    return res.status(200).json(success("Computers fetched successfully.", result));
  } catch (error) {
    return next(error);
  }
}

async function getAvailability(req, res, next) {
  try {
    const result = await computerService.getComputerAvailability(
      req.params.id,
      req.query.date
    );
    return res
      .status(200)
      .json(success("Computer availability fetched successfully.", result));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getComputers,
  getAvailability,
};
