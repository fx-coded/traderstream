/**
 * Enhanced logger for the Trader Stream Backend
 * Provides formatted console logging with timestamps and emoji indicators
 */
const logger = {
  info: (message) => console.log(`ℹ️ ${new Date().toISOString()} - ${message}`),
  warn: (message) => console.warn(`⚠️ ${new Date().toISOString()} - ${message}`),
  error: (message, error) => console.error(`❌ ${new Date().toISOString()} - ${message}`, error || ''),
  success: (message) => console.log(`✅ ${new Date().toISOString()} - ${message}`),
  debug: (message, data) => {
    if (process.env.DEBUG === 'true') {
      console.log(`🔍 ${new Date().toISOString()} - ${message}`, data || '');
    }
  }
};

module.exports = logger;