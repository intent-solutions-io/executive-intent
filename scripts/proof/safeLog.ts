/**
 * Safe logging utility for Executive Intent proof system
 *
 * Automatically redacts sensitive patterns from log output to prevent
 * accidental secret exposure in CI logs or terminal output.
 */

import { redactString } from './redact';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_PREFIXES: Record<LogLevel, string> = {
  info: '[proof]',
  warn: '[proof] ⚠️',
  error: '[proof] ❌',
  debug: '[proof] 🔍',
};

/**
 * Safe log function that redacts secrets before output
 */
export function safeLog(message: string, data?: unknown, level: LogLevel = 'info'): void {
  const prefix = LOG_PREFIXES[level];
  const safeMessage = redactString(message);

  if (data !== undefined) {
    const safeData = redactString(JSON.stringify(data, null, 2));
    console.log(`${prefix} ${safeMessage}`, safeData);
  } else {
    console.log(`${prefix} ${safeMessage}`);
  }
}

/**
 * Safe info log
 */
export function logInfo(message: string, data?: unknown): void {
  safeLog(message, data, 'info');
}

/**
 * Safe warning log
 */
export function logWarn(message: string, data?: unknown): void {
  safeLog(message, data, 'warn');
}

/**
 * Safe error log
 */
export function logError(message: string, data?: unknown): void {
  safeLog(message, data, 'error');
}

/**
 * Safe debug log (only outputs if DEBUG env var is set)
 */
export function logDebug(message: string, data?: unknown): void {
  if (process.env.DEBUG) {
    safeLog(message, data, 'debug');
  }
}
