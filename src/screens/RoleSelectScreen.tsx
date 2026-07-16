import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStoreData } from '../services/store';
import { colors, radius, spacing } from '../theme';
import { Role } from '../types';

export function RoleSelectScreen(props: { onSelect: (role: Role) => void }) {
  const { config } = useStoreData();
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>💈</Text>
      <Text style={styles.title}>{config.shopName}</Text>
      <Text style={styles.subtitle}>Agendamento de horários</Text>

      <Text style={styles.question}>Como você vai usar o app?</Text>

      <Pressable
        testID="role-cliente"
        onPress={() => props.onSelect('cliente')}
        style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.roleEmoji}>🧔</Text>
        <View style={styles.roleTextBox}>
          <Text style={styles.roleTitle}>Sou cliente</Text>
          <Text style={styles.roleDescription}>
            Quero agendar um corte ou barba
          </Text>
        </View>
      </Pressable>

      <Pressable
        testID="role-barbeiro"
        onPress={() => props.onSelect('barbeiro')}
        style={({ pressed }) => [styles.roleCard, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.roleEmoji}>✂️</Text>
        <View style={styles.roleTextBox}>
          <Text style={styles.roleTitle}>Sou o barbeiro</Text>
          <Text style={styles.roleDescription}>
            Quero gerenciar minha agenda
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 4,
  },
  question: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.xl * 1.5,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  roleEmoji: {
    fontSize: 34,
  },
  roleTextBox: {
    flex: 1,
  },
  roleTitle: {
    color: colors.gold,
    fontSize: 18,
    fontWeight: '700',
  },
  roleDescription: {
    color: colors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
});
