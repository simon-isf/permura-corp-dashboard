import React, { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface LoadingTimeoutProps {
  isLoading: boolean
  timeoutMs?: number
  onTimeout?: () => void
  onRetry?: () => void
  children: React.ReactNode
}

export const LoadingTimeout: React.FC<LoadingTimeoutProps> = ({
  isLoading,
  timeoutMs = 30000, // 30 seconds default
  onTimeout,
  onRetry,
  children
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false)
      setTimeElapsed(0)
      return
    }

    const startTime = Date.now()
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      setTimeElapsed(elapsed)
      
      if (elapsed >= timeoutMs) {
        setHasTimedOut(true)
        onTimeout?.()
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isLoading, timeoutMs, onTimeout])

  if (hasTimedOut) {
    return (
      <Card className="border-yellow-500/20 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-600">
            <AlertTriangle className="h-5 w-5" />
            Loading Timeout
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The request is taking longer than expected. This might be due to:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Slow internet connection</li>
              <li>Server overload</li>
              <li>Network connectivity issues</li>
              <li>Large dataset being processed</li>
            </ul>
            {onRetry && (
              <Button 
                onClick={() => {
                  setHasTimedOut(false)
                  setTimeElapsed(0)
                  onRetry()
                }}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading && timeElapsed > 10000) { // Show warning after 10 seconds
    return (
      <div className="space-y-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Still loading... ({Math.round(timeElapsed / 1000)}s)
            </div>
          </CardContent>
        </Card>
        {children}
      </div>
    )
  }

  return <>{children}</>
}
