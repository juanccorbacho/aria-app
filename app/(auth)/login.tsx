import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Link, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const router = useRouter();
  const { login, isLoading, errorMessage } = useAuth();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha para continuar.');
      return;
    }

    try {
      await login(email.trim(), password);
      router.replace('/dashboard');
    } catch {
      // O erro já é tratado no hook, mostramos apenas um alerta genérico aqui.
      Alert.alert('Erro ao entrar', 'Verifique seus dados e tente novamente.');
    }
  };

  const backgroundColor = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const accentColor = colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ThemedView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Ária
          </ThemedText>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Clareza financeira para o seu dia a dia.
          </ThemedText>
        </View>

        <View style={styles.form}>
          <ThemedText style={styles.label}>E-mail</ThemedText>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { borderColor: Colors[colorScheme].icon, color: textColor }]}
          />

          <ThemedText style={styles.label}>Senha</ThemedText>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry
            autoCapitalize="none"
            placeholderTextColor={Colors[colorScheme].icon}
            style={[styles.input, { borderColor: Colors[colorScheme].icon, color: textColor }]}
          />

          {errorMessage ? (
            <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
          ) : null}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={[styles.primaryButton, { backgroundColor: accentColor }]}>
            <ThemedText type="defaultSemiBold" style={styles.primaryButtonText}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </ThemedText>
          </TouchableOpacity>

          <View style={styles.footer}>
            <ThemedText>Não tem conta?</ThemedText>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <ThemedText type="link">Criar conta</ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#000',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    color: '#ff4d4f',
    marginTop: 4,
  },
});

