import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bug } from 'lucide-react'

export const DebugPanel: React.FC = () => {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="border-yellow-500/20 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600">
          <Bug className="h-5 w-5" />
          Debug Panel
          <Badge variant="outline" className="text-xs">Development Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground">
          <p>Debug information will appear here during development.</p>
          <p className="mt-2">Check browser console for detailed logs.</p>
        </div>
      </CardContent>
    </Card>
  )
}
