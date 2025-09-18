// Debug helpers for infinite loading issues

export const debugQueryState = (queryClient: any) => {
  const queries = queryClient.getQueryCache().getAll()
  console.group('🔍 Query Cache Debug')
  
  queries.forEach((query: any) => {
    console.log(`Query: ${JSON.stringify(query.queryKey)}`, {
      status: query.state.status,
      fetchStatus: query.state.fetchStatus,
      dataUpdatedAt: new Date(query.state.dataUpdatedAt).toLocaleTimeString(),
      errorUpdatedAt: query.state.errorUpdatedAt ? new Date(query.state.errorUpdatedAt).toLocaleTimeString() : 'Never',
      isInvalidated: query.state.isInvalidated,
      isStale: query.isStale(),
      hasData: !!query.state.data,
      error: query.state.error
    })
  })
  
  console.groupEnd()
}

export const clearAllCaches = (queryClient: any) => {
  console.log('🧹 Clearing all caches...')
  
  // Clear React Query cache
  queryClient.clear()
  
  // Clear localStorage
  try {
    localStorage.clear()
    console.log('✅ localStorage cleared')
  } catch (e) {
    console.warn('⚠️ Could not clear localStorage:', e)
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.clear()
    console.log('✅ sessionStorage cleared')
  } catch (e) {
    console.warn('⚠️ Could not clear sessionStorage:', e)
  }
  
  console.log('✅ All caches cleared')
}

export const logFilterChanges = (filters: any, source: string) => {
  console.log(`🔄 Filter change from ${source}:`, {
    dateRange: filters.dateRange ? {
      start: filters.dateRange.start?.toISOString(),
      end: filters.dateRange.end?.toISOString()
    } : null,
    selectedClosers: filters.selectedClosers,
    selectedSetters: filters.selectedSetters,
    selectedCompany: filters.selectedCompany,
    timestamp: new Date().toISOString()
  })
}

export const detectInfiniteLoop = (() => {
  const callCounts = new Map<string, { count: number, lastCall: number }>()
  
  return (key: string, threshold = 10, timeWindow = 5000) => {
    const now = Date.now()
    const existing = callCounts.get(key)
    
    if (!existing || now - existing.lastCall > timeWindow) {
      callCounts.set(key, { count: 1, lastCall: now })
      return false
    }
    
    existing.count++
    existing.lastCall = now
    
    if (existing.count > threshold) {
      console.error(`🚨 INFINITE LOOP DETECTED: ${key} called ${existing.count} times in ${timeWindow}ms`)
      return true
    }
    
    return false
  }
})()

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugHelpers = {
    debugQueryState,
    clearAllCaches,
    logFilterChanges,
    detectInfiniteLoop
  }
}
