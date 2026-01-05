// ============================================================================
// IMPORTS
// ============================================================================

import winston from 'winston';
import path from 'path';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE = 5242880; // 5MB
const MAX_FILES_KEPT = 5;
const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOGS_DIR = path.join(__dirname, '../../logs');

// ============================================================================
// FORMAT CONFIGURATION
// ============================================================================

/**
 * Format for file output (JSON format for structured logging).
 * Includes timestamp, error stacks, and all metadata.
 */
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

/**
 * Format for console output (human-readable with colors).
 * Displays timestamp, log level, message, and metadata in a readable format.
 */
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let logMessage = `${timestamp} [${level}]: ${message}`;

        // Append metadata if present
        if (Object.keys(metadata).length > 0) {
            logMessage += ` ${JSON.stringify(metadata)}`;
        }

        return logMessage;
    })
);

// ============================================================================
// LOGGER INITIALIZATION
// ============================================================================

/**
 * Winston logger instance configured with multiple transports.
 * - File: All logs (combined.log) and error-only logs (error.log)
 * - Console: Colored human-readable output for development
 */
const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: fileFormat,
    transports: [
        // Combined log file (all log levels)
        new winston.transports.File({
            filename: path.join(LOGS_DIR, 'combined.log'),
            maxsize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES_KEPT,
        }),

        // Error-only log file
        new winston.transports.File({
            filename: path.join(LOGS_DIR, 'error.log'),
            level: 'error',
            maxsize: MAX_FILE_SIZE,
            maxFiles: MAX_FILES_KEPT,
        }),

        // Console output (development)
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
});

export default logger;
