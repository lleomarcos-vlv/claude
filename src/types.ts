export type Role = 'cliente' | 'barbeiro';

export type AppointmentStatus = 'pendente' | 'confirmado' | 'cancelado';

export interface Service {
  id: string;
  name: string;
  price: number;
  emoji: string;
}

export const SERVICES: Service[] = [
  { id: 'corte', name: 'Corte de cabelo', price: 35, emoji: '✂️' },
  { id: 'barba', name: 'Barba', price: 25, emoji: '🧔' },
  { id: 'corte-barba', name: 'Corte + Barba', price: 55, emoji: '💈' },
];

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName: string;
  price: number;
  /** Data no formato YYYY-MM-DD */
  date: string;
  /** Horário no formato HH:mm */
  time: string;
  status: AppointmentStatus;
  createdAt: number;
}

export type NewAppointment = Omit<Appointment, 'id' | 'status' | 'createdAt'>;

export interface ScheduleConfig {
  barberName: string;
  shopName: string;
  /** Dias abertos: 0=domingo ... 6=sábado */
  openDays: number[];
  /** Início do expediente, ex. "09:00" */
  startTime: string;
  /** Fim do expediente, ex. "19:00" */
  endTime: string;
  /** Duração de cada horário em minutos */
  slotMinutes: number;
  /** Quantos dias à frente a agenda fica aberta */
  daysAhead: number;
}

export const DEFAULT_CONFIG: ScheduleConfig = {
  barberName: 'Daniel',
  shopName: 'Barbearia do Daniel',
  openDays: [1, 2, 3, 4, 5, 6],
  startTime: '09:00',
  endTime: '19:00',
  slotMinutes: 30,
  daysAhead: 14,
};

export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
}

export function isActive(a: Appointment): boolean {
  return a.status !== 'cancelado';
}

export function statusLabel(s: AppointmentStatus): string {
  switch (s) {
    case 'pendente':
      return 'Aguardando confirmação';
    case 'confirmado':
      return 'Confirmado';
    case 'cancelado':
      return 'Cancelado';
  }
}
