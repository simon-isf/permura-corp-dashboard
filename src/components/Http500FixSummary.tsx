import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Server } from 'lucide-react'

export const Http500FixSummary: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="border-purple-500/20 bg-purple-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-600">
          <Server className="h-5 w-5" />
          HTTP 500 Fix Summary
          <Badge variant="outline" className="text-xs">Development Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Server error resolution and fix summary information.</p>
        </div>
      </CardContent>
    </Card>
  )
}
