import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
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

import { DayStrip, SlotGrid, SlotState } from '../../components/schedule';
import {
  BottomTabs,
  Card,
  DemoBanner,
  GhostButton,
  PrimaryButton,
  SectionTitle,
  StatusTag,
} from '../../components/ui';
import { findActiveBySlot, genId, useStoreData } from '../../services/store';
import { colors, radius, spacing } from '../../theme';
import { Appointment, ClientProfile, SERVICES } from '../../types';
import {
  formatFullDate,
  formatPrice,
  formatShortDate,
  isSlotInPast,
  timeSlots,
  toISODate,
  upcomingDays,
} from '../../utils/dates';

const K_PROFILE = '@barbearia/perfilCliente';

function notifyError(message: string) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    window.alert(message);
  } else {
    Alert.alert('Ops', message);
  }
}

export function ClientApp(props: { onSwitchRole: () => void }) {
  const { store, config, appointments } = useStoreData();

  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [tab, setTab] = useState('agendar');

  useEffect(() => {
    AsyncStorage.getItem(K_PROFILE)
      .then((raw) => {
        if (raw) setProfile(JSON.parse(raw));
      })
      .finally(() => setProfileLoaded(true));
  }, []);

  const saveProfile = async (name: string, phone: string) => {
    const p: ClientProfile = { id: genId(), name, phone };
    setProfile(p);
    await AsyncStorage.setItem(K_PROFILE, JSON.stringify(p));
  };

  if (!profileLoaded) {
    return <View style={styles.screen} />;
  }

  if (!profile) {
    return <ProfileForm onSave={saveProfile} onSwitchRole={props.onSwitchRole} />;
  }

  const myAppointments = appointments
    .filter((a) => a.clientId === profile.id)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const pendingOrConfirmed = myAppointments.filter(
    (a) => a.status !== 'cancelado' && !isSlotInPast(a.date, a.time)
  ).length;

  return (
    <View style={styles.screen}>
      {store.mode === 'local' && <DemoBanner />}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>💈</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{config.shopName}</Text>
          <Text style={styles.headerSubtitle}>Olá, {profile.name}!</Text>
        </View>
      </View>

      {tab === 'agendar' ? (
        <BookingTab profile={profile} onBooked={() => setTab('meus')} />
      ) : (
        <MyBookingsTab
          appointments={myAppointments}
          onNewBooking={() => setTab('agendar')}
          onSwitchRole={props.onSwitchRole}
        />
      )}

      <BottomTabs
        tabs={[
          { key: 'agendar', label: 'Agendar', emoji: '📅' },
          {
            key: 'meus',
            label: pendingOrConfirmed > 0 ? `Meus horários (${pendingOrConfirmed})` : 'Meus horários',
            emoji: '🗓️',
          },
        ]}
        active={tab}
        onChange={setTab}
      />
    </View>
  );
}

function ProfileForm(props: {
  onSave: (name: string, phone: string) => void;
  onSwitchRole: () => void;
}) {
  const { config } = useStoreData();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const canSave = name.trim().length >= 2 && phone.trim().length >= 8;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.profileContainer}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.profileEmoji}>💈</Text>
      <Text style={styles.profileTitle}>{config.shopName}</Text>
      <Text style={styles.profileSubtitle}>
        Antes de agendar, diga quem é você. O barbeiro verá esses dados na
        agenda dele.
      </Text>

      <Card style={{ width: '100%', maxWidth: 420 }}>
        <Text style={styles.inputLabel}>Seu nome</Text>
        <TextInput
          testID="input-nome"
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex.: João Silva"
          placeholderTextColor={colors.textDim}
        />
        <Text style={[styles.inputLabel, { marginTop: spacing.md }]}>
          WhatsApp / telefone
        </Text>
        <TextInput
          testID="input-fone"
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Ex.: (11) 99999-0000"
          placeholderTextColor={colors.textDim}
          keyboardType="phone-pad"
        />
        <View style={{ height: spacing.lg }} />
        <PrimaryButton
          testID="btn-comecar"
          title="Começar"
          disabled={!canSave}
          onPress={() => props.onSave(name.trim(), phone.trim())}
        />
      </Card>

      <View style={{ height: spacing.lg }} />
      <GhostButton title="Trocar de perfil" onPress={props.onSwitchRole} />
    </ScrollView>
  );
}

function BookingTab(props: { profile: ClientProfile; onBooked: () => void }) {
  const { store, config, appointments } = useStoreData();
  const { profile } = props;

  const days = useMemo(
    () => upcomingDays(config.daysAhead),
    [config.daysAhead]
  );

  const firstOpenDay = useMemo(() => {
    const open = days.find((d) => config.openDays.includes(d.getDay()));
    return open ? toISODate(open) : toISODate(days[0]);
  }, [days, config.openDays]);

  const [serviceId, setServiceId] = useState(SERVICES[0].id);
  const [dateISO, setDateISO] = useState(firstOpenDay);
  const [time, setTime] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Appointment | null>(null);

  const slots = useMemo(
    () => timeSlots(config.startTime, config.endTime, config.slotMinutes),
    [config.startTime, config.endTime, config.slotMinutes]
  );

  const service = SERVICES.find((s) => s.id === serviceId) ?? SERVICES[0];

  const stateOf = (t: string): SlotState => {
    const existing = findActiveBySlot(appointments, dateISO, t);
    if (existing) {
      return existing.clientId === profile.id ? 'mine' : 'taken';
    }
    if (isSlotInPast(dateISO, t)) return 'past';
    return t === time ? 'selected' : 'free';
  };

  const confirmBooking = async () => {
    if (!time) return;
    setSaving(true);
    const result = await store.createAppointment({
      clientId: profile.id,
      clientName: profile.name,
      clientPhone: profile.phone,
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      date: dateISO,
      time,
    });
    setSaving(false);
    if (result.ok) {
      setCreated(result.appointment);
      setTime(null);
    } else {
      setTime(null);
      notifyError(result.error);
    }
  };

  if (created) {
    // Usa a versão ao vivo do agendamento: se o barbeiro confirmar enquanto
    // esta tela está aberta, o status muda na hora.
    const live = appointments.find((a) => a.id === created.id) ?? created;
    return (
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <Card style={styles.successCard}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle} testID="success-title">
            Horário reservado!
          </Text>
          <Text style={styles.successText}>
            {live.serviceName} · {formatFullDate(live.date)} às{' '}
            <Text style={{ color: colors.gold, fontWeight: '800' }}>
              {live.time}
            </Text>
          </Text>
          <View style={{ height: spacing.sm }} />
          <StatusTag status={live.status} />
          <Text style={styles.successHint}>
            Seu horário já aparece na agenda do {config.barberName}. Assim que
            ele confirmar, o status muda para “Confirmado” aqui no app.
          </Text>
        </Card>
        <View style={{ height: spacing.md }} />
        <PrimaryButton
          testID="btn-ver-meus"
          title="Acompanhar meus horários"
          onPress={props.onBooked}
        />
        <View style={{ height: spacing.sm }} />
        <GhostButton
          title="Fazer outro agendamento"
          onPress={() => setCreated(null)}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <SectionTitle>1. Escolha o serviço</SectionTitle>
      <View style={styles.serviceRow}>
        {SERVICES.map((s) => {
          const isSelected = s.id === serviceId;
          return (
            <Pressable
              key={s.id}
              testID={`servico-${s.id}`}
              onPress={() => setServiceId(s.id)}
              style={[
                styles.serviceCard,
                isSelected && {
                  borderColor: colors.gold,
                  backgroundColor: colors.cardAlt,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
              <Text
                style={[styles.serviceName, isSelected && { color: colors.gold }]}
              >
                {s.name}
              </Text>
              <Text style={styles.servicePrice}>{formatPrice(s.price)}</Text>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>2. Escolha o dia</SectionTitle>
      <DayStrip
        days={days}
        selected={dateISO}
        onSelect={(iso) => {
          setDateISO(iso);
          setTime(null);
        }}
        openDays={config.openDays}
      />
      <Text style={styles.selectedDateLabel}>{formatFullDate(dateISO)}</Text>

      <SectionTitle>3. Escolha o horário</SectionTitle>
      <SlotGrid slots={slots} stateOf={stateOf} onSelect={setTime} />

      <View style={{ height: spacing.lg }} />
      {time ? (
        <Card style={{ borderColor: colors.gold }}>
          <Text style={styles.summaryTitle}>Resumo do agendamento</Text>
          <Text style={styles.summaryLine}>
            {service.emoji} {service.name} — {formatPrice(service.price)}
          </Text>
          <Text style={styles.summaryLine}>
            📅 {formatFullDate(dateISO)} às{' '}
            <Text style={{ color: colors.gold, fontWeight: '800' }}>{time}</Text>
          </Text>
          <View style={{ height: spacing.md }} />
          <PrimaryButton
            testID="btn-confirmar"
            title={`Confirmar ${formatShortDate(dateISO)} às ${time}`}
            loading={saving}
            onPress={confirmBooking}
          />
        </Card>
      ) : (
        <Text style={styles.pickHint}>
          Toque em um horário livre para continuar.
        </Text>
      )}
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

function MyBookingsTab(props: {
  appointments: Appointment[];
  onNewBooking: () => void;
  onSwitchRole: () => void;
}) {
  const { store } = useStoreData();

  const cancel = (a: Appointment) => {
    const doCancel = () => store.setStatus(a.id, 'cancelado');
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm(`Cancelar ${a.serviceName} de ${formatShortDate(a.date)} às ${a.time}?`)) {
        doCancel();
      }
    } else {
      Alert.alert('Cancelar horário', `Cancelar ${a.serviceName} de ${formatShortDate(a.date)} às ${a.time}?`, [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar horário', style: 'destructive', onPress: doCancel },
      ]);
    }
  };

  return (
    <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
      <SectionTitle>Meus horários</SectionTitle>
      {props.appointments.length === 0 && (
        <Card>
          <Text style={styles.emptyText}>
            Você ainda não tem horários marcados.
          </Text>
          <View style={{ height: spacing.md }} />
          <PrimaryButton title="Agendar agora" onPress={props.onNewBooking} />
        </Card>
      )}
      {props.appointments.map((a) => (
        <Card key={a.id} style={styles.bookingCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bookingWhen}>
              {formatFullDate(a.date)} ·{' '}
              <Text style={{ color: colors.gold, fontWeight: '800' }}>
                {a.time}
              </Text>
            </Text>
            <Text style={styles.bookingService}>
              {a.serviceName} — {formatPrice(a.price)}
            </Text>
            <View style={{ height: 6 }} />
            <StatusTag status={a.status} />
          </View>
          {a.status !== 'cancelado' && !isSlotInPast(a.date, a.time) && (
            <GhostButton
              title="Cancelar"
              color={colors.red}
              onPress={() => cancel(a)}
            />
          )}
        </Card>
      ))}
      <View style={{ height: spacing.lg }} />
      <GhostButton title="Trocar de perfil" onPress={props.onSwitchRole} />
      <View style={{ height: spacing.xl }} />
    </ScrollView>
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
  profileContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xl * 2,
  },
  profileEmoji: {
    fontSize: 52,
  },
  profileTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  profileSubtitle: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
    marginVertical: spacing.lg,
    maxWidth: 420,
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
  serviceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  serviceCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  serviceName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  servicePrice: {
    color: colors.textDim,
    fontSize: 12,
  },
  selectedDateLabel: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  pickHint: {
    color: colors.textDim,
    fontSize: 13,
    textAlign: 'center',
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  summaryLine: {
    color: colors.text,
    fontSize: 14,
    marginTop: 4,
  },
  successCard: {
    alignItems: 'center',
    borderColor: colors.gold,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    color: colors.gold,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  successText: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  successHint: {
    color: colors.textDim,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: 'center',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  bookingWhen: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  bookingService: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
});
