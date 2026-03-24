export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number; // in minutes
  imageUrl: string;
}

export interface Booking {
  id: string;
  date: string; // ISO format
  time: string; // HH:mm
  clientName: string;
  clientPhone: string;
  serviceId: string;
  createdAt: string;
}

export interface WorkingHours {
  dayOfWeek: number; // 0-6
  intervals: { start: string; end: string }[];
  isOff: boolean;
}

export interface DayConfig {
  date: string; // YYYY-MM-DD
  intervals: { start: string; end: string }[];
  isOff: boolean;
}
