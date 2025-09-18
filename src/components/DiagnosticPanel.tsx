import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { useAppointments } from '@/hooks/useAppointments'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import { debugQueryState, clearAllCaches } from '@/utils/debugHelpers'

export const DiagnosticPanel: React.FC = () => {
  const [refreshCount, setRefreshCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const { profile, isAuthenticated, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()

  // Get current query state for appointments
  const appointmentsQuery = queryClient.getQueryState(['appointments'])

  // Monitor for changes
  useEffect(() => {
    setLastUpdate(new Date())
    setRefreshCount(prev => prev + 1)
  }, [appointmentsQuery?.status, appointmentsQuery?.fetchStatus])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const clearCache = () => {
    clearAllCaches(queryClient)
    setRefreshCount(0)
  }

  const debugQueries = () => {
    debugQueryState(queryClient)
  }

  return (
    <Card className="border-blue-500/20 bg-blue-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Activity className="h-5 w-5" />
          Diagnostic Panel
          <Badge variant="outline" className="text-xs">Development Only</Badge>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={debugQueries}
            >
              <Activity className="h-3 w-3 mr-1" />
              Debug
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearCache}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          {/* Authentication Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Authentication</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(isAuthenticated ? 'success' : 'error')}
                  <span>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(authLoading ? 'pending' : 'success')}
                  <span>Auth Loading: {authLoading ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(profile ? 'success' : 'error')}
                  <span>Profile: {profile?.role || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Query Status */}
            <div>
              <h4 className="font-medium mb-2">Query Status</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusIcon(appointmentsQuery?.status || 'idle')}
                  <span>Status: {appointmentsQuery?.status || 'idle'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(appointmentsQuery?.fetchStatus || 'idle')}
                  <span>Fetch: {appointmentsQuery?.fetchStatus || 'idle'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Refreshes: {refreshCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timing Information */}
          <div>
            <h4 className="font-medium mb-2">Timing</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
              <div>Data Updated: {appointmentsQuery?.dataUpdatedAt ? new Date(appointmentsQuery.dataUpdatedAt).toLocaleTimeString() : 'Never'}</div>
              <div>Error Updated: {appointmentsQuery?.errorUpdatedAt ? new Date(appointmentsQuery.errorUpdatedAt).toLocaleTimeString() : 'Never'}</div>
            </div>
          </div>

          {/* Error Information */}
          {appointmentsQuery?.error && (
            <div>
              <h4 className="font-medium mb-2 text-red-600">Error Details</h4>
              <div className="text-xs bg-red-50 p-2 rounded border text-red-700">
                {String(appointmentsQuery.error)}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
