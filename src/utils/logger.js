function write(level, message, meta = {}) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    message,
    ...meta
  };

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

const logger = {
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
  debug(message, meta) {
    if (process.env.NODE_ENV !== "production") {
      write("debug", message, meta);
    }
  }
};

export default logger;
