const TIME_SLOTS = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "14:00-15:00",
  "15:00-16:00",
  "16:00-17:00",
];

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function toDateOnlyUtc(dateString) {
  return new Date(`${dateString}T00:00:00.000Z`);
}

function formatDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

module.exports = {
  TIME_SLOTS,
  DATE_ONLY_REGEX,
  toDateOnlyUtc,
  formatDateOnly,
};
