import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { clearAllCaches } from '@/utils/debugHelpers'

export const EmergencyReset: React.FC = () => {
  const queryClient = useQueryClient()

  const handleEmergencyReset = () => {
    console.log('🚨 EMERGENCY RESET INITIATED')
    
    // Clear all caches
    clearAllCaches(queryClient)
    
    // Force reload the page
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const handleClearCacheOnly = () => {
    console.log('🧹 Clearing caches only')
    clearAllCaches(queryClient)
  }

  return (
    <Card className="border-red-500/20 bg-red-500/5 fixed top-4 right-4 z-50 w-80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-red-600 text-sm">
          <AlertTriangle className="h-4 w-4" />
          Emergency Reset
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          If you're experiencing infinite loading, try these options:
        </p>
        
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCacheOnly}
            className="w-full flex items-center gap-2"
          >
            <RefreshCw className="h-3 w-3" />
            Clear Cache Only
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEmergencyReset}
            className="w-full flex items-center gap-2"
          >
            <Trash2 className="h-3 w-3" />
            Emergency Reset & Reload
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Check browser console for debug information.
        </p>
      </CardContent>
    </Card>
  )
}

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).emergencyReset = () => {
    const queryClient = (window as any).__REACT_QUERY_CLIENT__
    if (queryClient) {
      clearAllCaches(queryClient)
      window.location.reload()
    } else {
      localStorage.clear()
      sessionStorage.clear()
      window.location.reload()
    }
  }
}
