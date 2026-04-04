function success(message, data) {
  return {
    success: true,
    message,
    data,
  };
}

function error(message, details) {
  const response = {
    success: false,
    message,
  };

  if (details) {
    response.details = details;
  }

  return response;
}

module.exports = {
  success,
  error,
};
