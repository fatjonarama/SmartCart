const winston = require("winston");
const { ElasticsearchTransport } = require("winston-elasticsearch");

const esTransportOpts = {
  level: "info",
  clientOpts: {
    node: "http://localhost:9200",
  },
  indexPrefix: "smartcart-logs",
};

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new ElasticsearchTransport(esTransportOpts),
  ],
});

module.exports = logger;