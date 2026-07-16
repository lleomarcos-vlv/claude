import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radius, spacing } from '../theme';
import { AppointmentStatus, statusLabel } from '../types';

export function PrimaryButton(props: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}) {
  const { title, onPress, disabled, loading, testID } = props;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryButton,
        (disabled || loading) && { opacity: 0.4 },
        pressed && { opacity: 0.75 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onGold} />
      ) : (
        <Text style={styles.primaryButtonText}>{title}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton(props: {
  title: string;
  onPress: () => void;
  color?: string;
  testID?: string;
}) {
  const { title, onPress, color = colors.gold, testID } = props;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghostButton,
        { borderColor: color },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.ghostButtonText, { color }]}>{title}</Text>
    </Pressable>
  );
}

export function Card(props: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.card, props.style]}>{props.children}</View>;
}

export function SectionTitle(props: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{props.children}</Text>;
}

const STATUS_STYLE: Record<
  AppointmentStatus,
  { bg: string; fg: string; dot: string }
> = {
  pendente: { bg: colors.amberBg, fg: colors.amber, dot: '●' },
  confirmado: { bg: colors.greenBg, fg: colors.green, dot: '✓' },
  cancelado: { bg: colors.redBg, fg: colors.red, dot: '✕' },
};

export function StatusTag(props: { status: AppointmentStatus }) {
  const s = STATUS_STYLE[props.status];
  return (
    <View style={[styles.statusTag, { backgroundColor: s.bg }]}>
      <Text style={[styles.statusTagText, { color: s.fg }]}>
        {s.dot} {statusLabel(props.status)}
      </Text>
    </View>
  );
}

export function DemoBanner() {
  return (
    <View style={styles.demoBanner}>
      <Text style={styles.demoBannerText}>
        Modo demonstração — dados salvos neste aparelho. Configure o Firebase
        (README) para sincronizar barbeiro e clientes em tempo real.
      </Text>
    </View>
  );
}

export interface TabItem {
  key: string;
  label: string;
  emoji: string;
}

export function BottomTabs(props: {
  tabs: TabItem[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <View style={styles.tabBar}>
      {props.tabs.map((tab) => {
        const isActive = tab.key === props.active;
        return (
          <Pressable
            key={tab.key}
            testID={`tab-${tab.key}`}
            onPress={() => props.onChange(tab.key)}
            style={styles.tabItem}
          >
            <Text style={{ fontSize: 20, opacity: isActive ? 1 : 0.45 }}>
              {tab.emoji}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                { color: isActive ? colors.gold : colors.textDim },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.onGold,
    fontSize: 16,
    fontWeight: '700',
  },
  ghostButton: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  statusTag: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: '700',
  },
  demoBanner: {
    backgroundColor: colors.cardAlt,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  demoBannerText: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
