import { initializeApp } from 'firebase/app';
import {
  Firestore,
  collection,
  doc,
  initializeFirestore,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import {
  Appointment,
  AppointmentStatus,
  DEFAULT_CONFIG,
  NewAppointment,
  ScheduleConfig,
} from '../types';
import { firebaseConfig } from './firebaseConfig';
import { BarberStore, CreateResult } from './store';

const COL_APPOINTMENTS = 'agendamentos';
const DOC_CONFIG = 'config/horarios';

/**
 * Sincronização em tempo real via Cloud Firestore.
 *
 * Cada horário vira um documento com id determinístico
 * ("2026-07-18_14-00"), o que impede dois clientes de marcarem o mesmo
 * horário: a transação de criação falha se o documento já existir com
 * status ativo.
 */
export class FirebaseStore implements BarberStore {
  readonly mode = 'firebase' as const;

  private db!: Firestore;
  private appointments: Appointment[] = [];
  private config: ScheduleConfig = DEFAULT_CONFIG;
  private listeners = new Set<() => void>();

  async init(): Promise<void> {
    const app = initializeApp(firebaseConfig);
    this.db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });

    await new Promise<void>((resolve) => {
      let appointmentsReady = false;
      let configReady = false;
      const maybeResolve = () => {
        if (appointmentsReady && configReady) resolve();
      };

      onSnapshot(collection(this.db, COL_APPOINTMENTS), (snap) => {
        this.appointments = snap.docs.map(
          (d) => ({ ...(d.data() as Omit<Appointment, 'id'>), id: d.id })
        );
        this.notify();
        appointmentsReady = true;
        maybeResolve();
      });

      onSnapshot(doc(this.db, DOC_CONFIG), (snap) => {
        if (snap.exists()) {
          this.config = { ...DEFAULT_CONFIG, ...(snap.data() as ScheduleConfig) };
        }
        this.notify();
        configReady = true;
        maybeResolve();
      });
    });
  }

  getConfig(): ScheduleConfig {
    return this.config;
  }

  async saveConfig(config: ScheduleConfig): Promise<void> {
    this.config = config;
    this.notify();
    await setDoc(doc(this.db, DOC_CONFIG), config);
  }

  getAppointments(): Appointment[] {
    return this.appointments;
  }

  async createAppointment(data: NewAppointment): Promise<CreateResult> {
    const id = `${data.date}_${data.time.replace(':', '-')}`;
    const ref = doc(this.db, COL_APPOINTMENTS, id);
    const appointment: Appointment = {
      ...data,
      id,
      status: 'pendente',
      createdAt: Date.now(),
    };
    try {
      await runTransaction(this.db, async (tx) => {
        const existing = await tx.get(ref);
        if (existing.exists() && existing.data()?.status !== 'cancelado') {
          throw new Error('slot-taken');
        }
        const { id: _omit, ...payload } = appointment;
        tx.set(ref, payload);
      });
      return { ok: true, appointment };
    } catch (e) {
      if (e instanceof Error && e.message === 'slot-taken') {
        return {
          ok: false,
          error: 'Este horário acabou de ser preenchido. Escolha outro, por favor.',
        };
      }
      return {
        ok: false,
        error: 'Falha de conexão. Verifique sua internet e tente novamente.',
      };
    }
  }

  async setStatus(id: string, status: AppointmentStatus): Promise<void> {
    await updateDoc(doc(this.db, COL_APPOINTMENTS, id), { status });
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }
}
