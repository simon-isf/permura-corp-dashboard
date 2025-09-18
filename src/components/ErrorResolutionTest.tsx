import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TestTube, Wifi, WifiOff, Database, RefreshCw } from 'lucide-react'
import { useAppointments } from '@/hooks/useAppointments'
import { useQueryClient } from '@tanstack/react-query'
import { supabaseClient } from '@/lib/supabase'

export const ErrorResolutionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, string>>({})
  const [isRunning, setIsRunning] = useState(false)
  const queryClient = useQueryClient()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const runTest = async (testName: string, testFn: () => Promise<string>) => {
    setIsRunning(true)
    try {
      const result = await testFn()
      setTestResults(prev => ({ ...prev, [testName]: `✅ ${result}` }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: `❌ ${String(error)}` }))
    }
    setIsRunning(false)
  }

  const testSupabaseConnection = async () => {
    const { data, error } = await supabaseClient.auth.getSession()
    if (error) throw error
    return `Connected. Session: ${data.session ? 'Active' : 'None'}`
  }

  const testEdgeFunctions = async () => {
    const { data, error } = await supabaseClient.functions.invoke('get-appointments', {
      body: { dateRange: { start: '2024-01-01', end: '2024-01-02' } }
    })
    if (error) throw error
    return `Edge function responsive. Data: ${data ? 'Received' : 'Empty'}`
  }

  const testQueryCache = async () => {
    const queries = queryClient.getQueryCache().getAll()
    const appointmentQueries = queries.filter(q => q.queryKey[0] === 'appointments')
    return `Cache has ${queries.length} total queries, ${appointmentQueries.length} appointment queries`
  }

  const forceRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] })
    setTestResults(prev => ({ ...prev, 'force-refresh': '🔄 Forced refresh initiated' }))
  }

  const clearAllData = () => {
    queryClient.clear()
    setTestResults({})
    setTestResults(prev => ({ ...prev, 'clear-data': '🗑️ All cache cleared' }))
  }

  return (
    <Card className="border-red-500/20 bg-red-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Error Resolution Test
          <Badge variant="outline" className="text-xs">Development Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('supabase', testSupabaseConnection)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Database className="h-3 w-3" />
              Test Supabase
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('edge-functions', testEdgeFunctions)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Wifi className="h-3 w-3" />
              Test Edge Functions
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => runTest('query-cache', testQueryCache)}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <TestTube className="h-3 w-3" />
              Test Query Cache
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={forceRefresh}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Force Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllData}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <WifiOff className="h-3 w-3" />
              Clear All Data
            </Button>
          </div>

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Test Results</h4>
              <div className="space-y-1 text-xs">
                {Object.entries(testResults).map(([test, result]) => (
                  <div key={test} className="bg-white/50 p-2 rounded border">
                    <strong>{test}:</strong> {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
