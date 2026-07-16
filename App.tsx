import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { BarberApp } from './src/screens/barber/BarberApp';
import { ClientApp } from './src/screens/client/ClientApp';
import { RoleSelectScreen } from './src/screens/RoleSelectScreen';
import { FirebaseStore } from './src/services/firebaseStore';
import { isFirebaseConfigured } from './src/services/firebaseConfig';
import { LocalStore } from './src/services/localStore';
import { BarberStore, StoreContext } from './src/services/store';
import { colors } from './src/theme';
import { Role } from './src/types';

const K_ROLE = '@barbearia/perfil';

/**
 * Na web é possível forçar o perfil pela URL (?perfil=cliente ou
 * ?perfil=barbeiro). É assim que a simulação abre "dois aparelhos"
 * lado a lado no mesmo navegador.
 */
function roleFromUrl(): Role | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const value = new URLSearchParams(window.location.search).get('perfil');
  return value === 'cliente' || value === 'barbeiro' ? value : null;
}

export default function App() {
  const store = useMemo<BarberStore>(
    () => (isFirebaseConfigured() ? new FirebaseStore() : new LocalStore()),
    []
  );

  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const roleLockedByUrl = useMemo(() => roleFromUrl() !== null, []);

  useEffect(() => {
    (async () => {
      try {
        await store.init();
      } finally {
        const fromUrl = roleFromUrl();
        if (fromUrl) {
          setRole(fromUrl);
        } else {
          const saved = await AsyncStorage.getItem(K_ROLE);
          if (saved === 'cliente' || saved === 'barbeiro') {
            setRole(saved);
          }
        }
        setReady(true);
      }
    })();
  }, [store]);

  const chooseRole = (r: Role) => {
    setRole(r);
    if (!roleLockedByUrl) {
      AsyncStorage.setItem(K_ROLE, r).catch(() => {});
    }
  };

  const switchRole = () => {
    setRole(null);
    if (!roleLockedByUrl) {
      AsyncStorage.removeItem(K_ROLE).catch(() => {});
    }
  };

  return (
    <SafeAreaProvider>
      <StoreContext.Provider value={store}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <StatusBar style="light" />
          {!ready ? (
            <View style={styles.loading}>
              <Text style={styles.loadingEmoji}>💈</Text>
              <ActivityIndicator color={colors.gold} />
            </View>
          ) : role === null ? (
            <RoleSelectScreen onSelect={chooseRole} />
          ) : role === 'cliente' ? (
            <ClientApp onSwitchRole={switchRole} />
          ) : (
            <BarberApp onSwitchRole={switchRole} />
          )}
        </SafeAreaView>
      </StoreContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.bg,
  },
  loadingEmoji: {
    fontSize: 48,
  },
});
