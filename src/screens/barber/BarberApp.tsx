import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { DayStrip } from '../../components/schedule';
import {
  BottomTabs,
  Card,
  DemoBanner,
  GhostButton,
  PrimaryButton,
  SectionTitle,
  StatusTag,
} from '../../components/ui';
import { useStoreData } from '../../services/store';
import { colors, radius, spacing } from '../../theme';
import { Appointment, ScheduleConfig } from '../../types';
import {
  formatFullDate,
  formatPrice,
  isSlotInPast,
  timeSlots,
  toISODate,
  upcomingDays,
  WEEKDAYS_SHORT,
} from '../../utils/dates';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function confirmDialog(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (window.confirm(message)) onYes();
  } else {
    Alert.alert('Atenção', message, [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Sim', style: 'destructive', onPress: onYes },
    ]);
  }
}

export function BarberApp(props: { onSwitchRole: () => void }) {
  const { store, config } = useStoreData();
  const [tab, setTab] = useState('agenda');

  return (
    <View style={styles.screen}>
      {store.mode === 'local' && <DemoBanner />}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>✂️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{config.shopName}</Text>
          <Text style={styles.headerSubtitle}>
            Painel do barbeiro · {config.barberName}
          </Text>
        </View>
      </View>

      {tab === 'agenda' ? (
        <AgendaTab />
      ) : (
        <SettingsTab onSwitchRole={props.onSwitchRole} />
      )}

      <BottomTabs
        tabs={[
          { key: 'agenda', label: 'Agenda', emoji: '📅' },
          { key: 'ajustes', label: 'Ajustes', emoji: '⚙️' },
        ]}
        active={tab}
        onChange={setTab}
      />
    </View>
  );
}

function AgendaTab() {
  const { store, config, appointments } = useStoreData();

  const days = useMemo(
    () => upcomingDays(config.daysAhead),
    [config.daysAhead]
  );
  const [dateISO, setDateISO] = useState(toISODate(days[0]));

  const slots = useMemo(
    () => timeSlots(config.startTime, config.endTime, config.slotMinutes),
    [config.startTime, config.endTime, config.slotMinutes]
  );

  const activeOf = (date: string, time: string): Appointment | undefined =>
    appointments.find(
      (a) => a.date === date && a.time === time && a.status !== 'cancelado'
    );

  const pendingDays = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => {
      if (a.status === 'pendente') set.add(a.date);
    });
    return set;
  }, [appointments]);

  const dayAppointments = appointments.filter(
    (a) => a.date === dateISO && a.status !== 'cancelado'
  );

  // Inclui horários marcados fora da grade atual (ex.: agendados antes de o
  // barbeiro mudar a duração dos horários), para nada sumir da agenda.
  const allTimes = useMemo(() => {
    const set = new Set(slots);
    dayAppointments.forEach((a) => set.add(a.time));
    return [...set].sort();
  }, [slots, dayAppointments]);

  const setStatus = (a: Appointment, status: 'confirmado' | 'cancelado') => {
    if (status === 'cancelado') {
      confirmDialog(
        `Cancelar o horário de ${a.clientName} (${a.time})?`,
        () => store.setStatus(a.id, status)
      );
    } else {
      store.setStatus(a.id, status);
    }
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <SectionTitle>Minha agenda</SectionTitle>
      <DayStrip
        days={days}
        selected={dateISO}
        onSelect={setDateISO}
        openDays={config.openDays}
        badges={pendingDays}
      />

      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle} testID="agenda-dia">
          {capitalize(formatFullDate(dateISO))}
        </Text>
        <View style={styles.countChip}>
          <Text style={styles.countChipText} testID="agenda-contagem">
            {dayAppointments.length}{' '}
            {dayAppointments.length === 1 ? 'horário marcado' : 'horários marcados'}
          </Text>
        </View>
      </View>

      {!config.openDays.includes(
        (() => {
          const [y, m, d] = dateISO.split('-').map(Number);
          return new Date(y, m - 1, d).getDay();
        })()
      ) && (
        <Card>
          <Text style={styles.emptyText}>
            A agenda está fechada neste dia. Abra o dia na aba Ajustes.
          </Text>
        </Card>
      )}

      {allTimes.map((time) => {
        const appointment = activeOf(dateISO, time);
        const past = isSlotInPast(dateISO, time);
        return (
          <View
            key={time}
            testID={`linha-${time}`}
            style={[styles.slotRow, past && !appointment && { opacity: 0.4 }]}
          >
            <Text style={styles.slotTime}>{time}</Text>
            {appointment ? (
              <Card
                style={[
                  styles.appointmentCard,
                  appointment.status === 'pendente' && {
                    borderColor: colors.amber,
                  },
                ]}
              >
                <View style={styles.appointmentHeader}>
                  <Text style={styles.clientName}>{appointment.clientName}</Text>
                  <StatusTag status={appointment.status} />
                </View>
                <Text style={styles.appointmentDetail}>
                  {appointment.serviceName} — {formatPrice(appointment.price)}
                </Text>
                <Text style={styles.appointmentDetail}>
                  📞 {appointment.clientPhone}
                </Text>
                <View style={styles.actionRow}>
                  {appointment.status === 'pendente' && (
                    <Pressable
                      testID={`confirmar-${appointment.time}`}
                      onPress={() => setStatus(appointment, 'confirmado')}
                      style={({ pressed }) => [
                        styles.confirmButton,
                        pressed && { opacity: 0.7 },
                      ]}
                    >
                      <Text style={styles.confirmButtonText}>
                        ✓ Confirmar horário
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    testID={`cancelar-${appointment.time}`}
                    onPress={() => setStatus(appointment, 'cancelado')}
                    style={({ pressed }) => [
                      styles.cancelButton,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </Pressable>
                </View>
              </Card>
            ) : (
              <View style={styles.freeSlot}>
                <Text style={styles.freeSlotText}>
                  {past ? 'Encerrado' : 'Livre'}
                </Text>
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function SettingsTab(props: { onSwitchRole: () => void }) {
  const { store, config } = useStoreData();
  const [draft, setDraft] = useState<ScheduleConfig>(config);
  const [saved, setSaved] = useState(false);

  const patch = (partial: Partial<ScheduleConfig>) => {
    setSaved(false);
    setDraft((d) => ({ ...d, ...partial }));
  };

  const toggleDay = (dow: number) => {
    patch({
      openDays: draft.openDays.includes(dow)
        ? draft.openDays.filter((d) => d !== dow)
        : [...draft.openDays, dow].sort(),
    });
  };

  const shiftTime = (field: 'startTime' | 'endTime', deltaMin: number) => {
    const [h, m] = draft[field].split(':').map(Number);
    let total = h * 60 + m + deltaMin;
    total = Math.max(0, Math.min(23 * 60 + 30, total));
    const hh = String(Math.floor(total / 60)).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    patch({ [field]: `${hh}:${mm}` } as Partial<ScheduleConfig>);
  };

  const save = async () => {
    await store.saveConfig(draft);
    setSaved(true);
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <SectionTitle>Barbearia</SectionTitle>
      <Card>
        <Text style={styles.inputLabel}>Nome da barbearia</Text>
        <TextInput
          style={styles.input}
          value={draft.shopName}
          onChangeText={(shopName) => patch({ shopName })}
          placeholderTextColor={colors.textDim}
        />
        <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
          Nome do barbeiro
        </Text>
        <TextInput
          style={styles.input}
          value={draft.barberName}
          onChangeText={(barberName) => patch({ barberName })}
          placeholderTextColor={colors.textDim}
        />
      </Card>

      <SectionTitle>Dias com agenda aberta</SectionTitle>
      <Card>
        <View style={styles.daysRow}>
          {WEEKDAYS_SHORT.map((label, dow) => {
            const on = draft.openDays.includes(dow);
            return (
              <Pressable
                key={dow}
                onPress={() => toggleDay(dow)}
                style={[styles.dayToggle, on && styles.dayToggleOn]}
              >
                <Text
                  style={[
                    styles.dayToggleText,
                    on && { color: colors.onGold, fontWeight: '700' },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <SectionTitle>Horário de atendimento</SectionTitle>
      <Card>
        <TimeStepper
          label="Abre às"
          value={draft.startTime}
          onShift={(d) => shiftTime('startTime', d)}
        />
        <View style={{ height: spacing.md }} />
        <TimeStepper
          label="Fecha às"
          value={draft.endTime}
          onShift={(d) => shiftTime('endTime', d)}
        />
        <View style={{ height: spacing.md }} />
        <Text style={styles.inputLabel}>Duração de cada horário</Text>
        <View style={styles.daysRow}>
          {[30, 45, 60].map((minutes) => {
            const on = draft.slotMinutes === minutes;
            return (
              <Pressable
                key={minutes}
                onPress={() => patch({ slotMinutes: minutes })}
                style={[styles.dayToggle, on && styles.dayToggleOn]}
              >
                <Text
                  style={[
                    styles.dayToggleText,
                    on && { color: colors.onGold, fontWeight: '700' },
                  ]}
                >
                  {minutes} min
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <View style={{ height: spacing.lg }} />
      <PrimaryButton
        title={saved ? '✓ Agenda salva' : 'Salvar agenda'}
        onPress={save}
      />
      <View style={{ height: spacing.sm }} />
      <GhostButton title="Trocar de perfil" onPress={props.onSwitchRole} />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function TimeStepper(props: {
  label: string;
  value: string;
  onShift: (deltaMin: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.inputLabel}>{props.label}</Text>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={() => props.onShift(-30)}
          style={({ pressed }) => [styles.stepperButton, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </Pressable>
        <Text style={styles.stepperValue}>{props.value}</Text>
        <Pressable
          onPress={() => props.onShift(30)}
          style={({ pressed }) => [styles.stepperButton, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  headerEmoji: {
    fontSize: 28,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textDim,
    fontSize: 13,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  dayTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  countChip: {
    backgroundColor: colors.cardAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countChipText: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  slotTime: {
    color: colors.textDim,
    fontSize: 14,
    fontWeight: '700',
    width: 48,
    paddingTop: 12,
  },
  appointmentCard: {
    flex: 1,
    padding: spacing.md,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  clientName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  appointmentDetail: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#0D1F15',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelButton: {
    borderColor: colors.red,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '600',
  },
  freeSlot: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  freeSlotText: {
    color: colors.textDim,
    fontSize: 13,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
  },
  inputLabel: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  daysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  dayToggle: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.bg,
  },
  dayToggleOn: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  dayToggleText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderColor: colors.gold,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '700',
  },
  stepperValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 56,
    textAlign: 'center',
  },
});
