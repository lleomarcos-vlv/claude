import React, { useContext, useEffect, useReducer } from 'react';

import {
  Appointment,
  AppointmentStatus,
  NewAppointment,
  ScheduleConfig,
} from '../types';

export type CreateResult =
  | { ok: true; appointment: Appointment }
  | { ok: false; error: string };

/**
 * Camada de dados compartilhada entre o app do cliente e o app do barbeiro.
 * Implementações: LocalStore (demonstração, dados no aparelho) e
 * FirebaseStore (produção, sincronização em tempo real).
 */
export interface BarberStore {
  readonly mode: 'local' | 'firebase';
  init(): Promise<void>;
  getConfig(): ScheduleConfig;
  saveConfig(config: ScheduleConfig): Promise<void>;
  getAppointments(): Appointment[];
  createAppointment(data: NewAppointment): Promise<CreateResult>;
  setStatus(id: string, status: AppointmentStatus): Promise<void>;
  subscribe(listener: () => void): () => void;
}

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function findActiveBySlot(
  appointments: Appointment[],
  date: string,
  time: string
): Appointment | undefined {
  return appointments.find(
    (a) => a.date === date && a.time === time && a.status !== 'cancelado'
  );
}

export const StoreContext = React.createContext<BarberStore | null>(null);

export function useStore(): BarberStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('StoreContext não foi inicializado');
  }
  return store;
}

/** Reassina o store e re-renderiza quando os dados mudam. */
export function useStoreData(): {
  store: BarberStore;
  config: ScheduleConfig;
  appointments: Appointment[];
} {
  const store = useStore();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => store.subscribe(forceUpdate), [store]);
  return {
    store,
    config: store.getConfig(),
    appointments: store.getAppointments(),
  };
}
