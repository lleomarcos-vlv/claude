import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  Appointment,
  AppointmentStatus,
  DEFAULT_CONFIG,
  NewAppointment,
  ScheduleConfig,
} from '../types';
import { BarberStore, CreateResult, findActiveBySlot, genId } from './store';

const K_APPOINTMENTS = '@barbearia/agendamentos';
const K_CONFIG = '@barbearia/config';

/**
 * Armazenamento local (modo demonstração, sem Firebase).
 *
 * No celular os dados ficam no aparelho. Na web, duas abas do mesmo
 * navegador se comportam como "dois aparelhos": o evento `storage`
 * sincroniza a agenda entre elas em tempo real — é assim que a
 * simulação cliente ⇄ barbeiro funciona.
 */
export class LocalStore implements BarberStore {
  readonly mode = 'local' as const;

  private appointments: Appointment[] = [];
  private config: ScheduleConfig = DEFAULT_CONFIG;
  private listeners = new Set<() => void>();

  async init(): Promise<void> {
    await this.reload();
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleExternalChange);
      window.addEventListener('focus', this.handleExternalChange);
    }
  }

  private handleExternalChange = () => {
    this.reload().catch(() => {});
  };

  private async reload(): Promise<void> {
    const entries = await AsyncStorage.multiGet([K_APPOINTMENTS, K_CONFIG]);
    const rawAppointments = entries[0][1];
    const rawConfig = entries[1][1];
    try {
      this.appointments = rawAppointments ? JSON.parse(rawAppointments) : [];
    } catch {
      this.appointments = [];
    }
    try {
      this.config = rawConfig
        ? { ...DEFAULT_CONFIG, ...JSON.parse(rawConfig) }
        : DEFAULT_CONFIG;
    } catch {
      this.config = DEFAULT_CONFIG;
    }
    this.notify();
  }

  getConfig(): ScheduleConfig {
    return this.config;
  }

  async saveConfig(config: ScheduleConfig): Promise<void> {
    this.config = config;
    await AsyncStorage.setItem(K_CONFIG, JSON.stringify(config));
    this.notify();
  }

  getAppointments(): Appointment[] {
    return this.appointments;
  }

  async createAppointment(data: NewAppointment): Promise<CreateResult> {
    // Recarrega antes de checar conflito para enxergar agendamentos
    // feitos em outra aba (web) desde o último evento.
    await this.reload();
    if (findActiveBySlot(this.appointments, data.date, data.time)) {
      return {
        ok: false,
        error: 'Este horário acabou de ser preenchido. Escolha outro, por favor.',
      };
    }
    const appointment: Appointment = {
      ...data,
      id: genId(),
      status: 'pendente',
      createdAt: Date.now(),
    };
    this.appointments = [...this.appointments, appointment];
    await this.persist();
    return { ok: true, appointment };
  }

  async setStatus(id: string, status: AppointmentStatus): Promise<void> {
    await this.reload();
    this.appointments = this.appointments.map((a) =>
      a.id === id ? { ...a, status } : a
    );
    await this.persist();
  }

  private async persist(): Promise<void> {
    await AsyncStorage.setItem(K_APPOINTMENTS, JSON.stringify(this.appointments));
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}
