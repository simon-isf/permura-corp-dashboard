// Test helpers for debugging and development
// This file provides utilities for testing the dashboard functionality

export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data)
  }
}

export const testConnection = async () => {
  try {
    debugLog('Testing Supabase connection...')
    // Add connection test logic here if needed
    return true
  } catch (error) {
    debugLog('Connection test failed:', error)
    return false
  }
}

// Export for global access in development
if (process.env.NODE_ENV === 'development') {
  (window as any).debugLog = debugLog
  (window as any).testConnection = testConnection
}
