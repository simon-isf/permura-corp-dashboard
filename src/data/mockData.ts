// Mock data for Roofing AI Systems Dashboard
import { subDays, addDays, format } from 'date-fns';

export interface Appointment {
  name: string;
  closer_name: string;
  booked_for: string;
  confirmation_disposition: 'Sat' | 'Rescheduled' | 'Not Interested' | 'Disqualified' | 'Follow-up' | 'Pending' | 'No Show' | 'Closed';
  note: string;
  phone_number: string;
  address: string;
  setter_name: string;
  setter_number: string;
  email: string;
  disposition_date: string;
  site_survey: string;
  m1_commission: number;
  m2_commission: number;
  contact_link: string;
  recording_media_link: string;
  credit_score: number;
  roof_type: string;
  existing_solar: boolean;
  shading: string;
  appointment_type: string;
  confirmed: boolean;
  contact_ID: string;
}

const closers = ['Sarah Johnson', 'Mike Chen', 'David Rodriguez', 'Emma Williams', 'James Thompson'];
const setters = ['Alex Parker', 'Lisa Brown', 'Tony Garcia', 'Maria Lopez', 'Ryan Davis'];
const dispositions: Appointment['confirmation_disposition'][] = ['Sat', 'Rescheduled', 'Not Interested', 'Disqualified', 'Follow-up', 'Pending', 'No Show', 'Closed'];
const roofTypes = ['Shingles', 'Meadows', 'Flat Roof', 'Other'];
const appointmentTypes = ['In-Person', 'Virtual'];
const shadingOptions = ['Yes', 'No'];

// Generate realistic mock data
export const generateMockAppointments = (count: number = 150): Appointment[] => {
  const appointments: Appointment[] = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const bookedDate = subDays(today, Math.floor(Math.random() * 30));
    const dispositionDate = addDays(bookedDate, Math.floor(Math.random() * 7));
    
    appointments.push({
      name: `Customer ${i + 1}`,
      closer_name: closers[Math.floor(Math.random() * closers.length)],
      booked_for: format(bookedDate, 'yyyy-MM-dd HH:mm:ss'),
      confirmation_disposition: dispositions[Math.floor(Math.random() * dispositions.length)],
      note: `Notes for appointment ${i + 1}`,
      phone_number: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      address: `${Math.floor(Math.random() * 9999) + 1} Main St, City, State ${String(Math.floor(Math.random() * 90000) + 10000)}`,
      setter_name: setters[Math.floor(Math.random() * setters.length)],
      setter_number: `(555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      email: `customer${i + 1}@email.com`,
      disposition_date: format(dispositionDate, 'yyyy-MM-dd'),
      site_survey: `Site survey details for ${i + 1}`,
      m1_commission: Math.floor(Math.random() * 500) + 100,
      m2_commission: Math.floor(Math.random() * 300) + 50,
      contact_link: `https://crm.example.com/contact/${i + 1}`,
      recording_media_link: `https://recordings.example.com/${i + 1}`,
      credit_score: Math.floor(Math.random() * 300) + 500,
      roof_type: roofTypes[Math.floor(Math.random() * roofTypes.length)],
      existing_solar: Math.random() > 0.7,
      shading: shadingOptions[Math.floor(Math.random() * shadingOptions.length)],
      appointment_type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
      confirmed: Math.random() > 0.2,
      contact_ID: `CONTACT_${String(i + 1).padStart(6, '0')}`,
    });
  }
  
  return appointments;
};

export const mockAppointments = generateMockAppointments();