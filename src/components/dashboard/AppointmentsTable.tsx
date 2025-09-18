import { useState, useMemo } from "react";
import { ArrowUpDown, ExternalLink, Phone, Mail, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Appointment } from "@/services/appointmentsService";

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
  'Pending': 'bg-secondary text-secondary-foreground',
  'No Show': 'bg-orange-100 text-orange-800',
  'Closed': 'bg-emerald-100 text-emerald-800'
};

export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  const [sortField, setSortField] = useState<SortField>('booked_for');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 13;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter appointments based on search query
  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    
    const query = searchQuery.toLowerCase();
    return appointments.filter(appointment => {
      // Search across all string fields
      const searchableFields = [
        appointment.name,
        appointment.closer_name,
        appointment.setter_name,
        appointment.confirmation_disposition,
        appointment.phone_number,
        appointment.address,
        appointment.email,
        appointment.note,
        appointment.site_survey,
        appointment.contact_link,
        appointment.roof_type,
        appointment.shading,
        appointment.appointment_type,
        appointment.contact_ID,
        appointment.booked_for,
        appointment.disposition_date
      ];
      
      return searchableFields.some(field => 
        field && field.toString().toLowerCase().includes(query)
      );
    });
  }, [appointments, searchQuery]);

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedAppointments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAppointments = sortedAppointments.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Detailed Appointments View
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sortedAppointments.length)} of {sortedAppointments.length} appointments
              {searchQuery && ` (filtered from ${appointments.length} total)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-xs bg-muted rounded-md">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search appointments (name, closer, setter, address, phone, etc.)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
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
                {paginatedAppointments.map((appointment, index) => (
                  <TableRow
                    key={appointment.id || `appointment-${index}`}
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
                        dispositionColors[appointment.confirmation_disposition as keyof typeof dispositionColors]
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
}