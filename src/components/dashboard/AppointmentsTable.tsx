import { useState } from "react";
import { ArrowUpDown, ExternalLink, Phone, Mail } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/data/mockData";

interface AppointmentsTableProps {
  appointments: Appointment[];
}

type SortField = keyof Appointment;
type SortDirection = 'asc' | 'desc';

const dispositionColors = {
  'Sat': 'bg-success text-success-foreground',
  'Rescheduled': 'bg-warning text-warning-foreground',
  'Not Interested': 'bg-destructive text-destructive-foreground',
  'Disqualified': 'bg-muted text-muted-foreground',
  'Follow-up': 'bg-info text-info-foreground',
  'Pending': 'bg-secondary text-secondary-foreground'
};

export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  const [sortField, setSortField] = useState<SortField>('booked_for');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-0 font-medium hover:bg-transparent"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );

  return (
    <Card className="bg-dashboard-surface border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Detailed Appointments View
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {appointments.length} appointments found
        </p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-dashboard-surface-hover">
                <TableHead>
                  <SortButton field="name">Customer</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="closer_name">Closer</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="setter_name">Setter</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="booked_for">Booked For</SortButton>
                </TableHead>
                <TableHead>
                  <SortButton field="confirmation_disposition">Disposition</SortButton>
                </TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAppointments.map((appointment, index) => (
                <TableRow 
                  key={appointment.contact_ID} 
                  className="border-border hover:bg-dashboard-surface-hover transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {appointment.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {appointment.closer_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {appointment.setter_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(appointment.booked_for), 'MMM dd, yyyy h:mm a')}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(
                      "text-xs font-medium",
                      dispositionColors[appointment.confirmation_disposition]
                    )}>
                      {appointment.confirmation_disposition}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {appointment.address}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(`tel:${appointment.phone_number}`)}
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(`mailto:${appointment.email}`)}
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => window.open(appointment.contact_link, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}