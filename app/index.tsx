import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { API_BASE_URL } from '@/lib/api';
import { setSession } from '@/lib/session';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const disabled = useMemo(() => !correo.trim() || !contrasena, [correo, contrasena]);

  const onLogin = async () => {
    if (disabled || cargando) return;

    setError('');
    setCargando(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          correo: correo.trim().toLowerCase(),
          contrasena,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        setError(data?.mensaje || `Error HTTP ${resp.status}`);
        return;
      }

      const token = String(data?.accessToken || data?.token || '');
      setSession(token, data?.usuario || null);

      router.replace('/principal' as never);
    } catch (e: any) {
      setError(`Error de conexion con la API: ${e?.message || 'desconocido'}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <ImageBackground
      source={require('@/assets/images/fondo3.webp')}
      style={styles.background}
      resizeMode="cover">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}>
            <View style={styles.card}>
              <Text style={styles.brand}>Move & Lite</Text>
              <Text style={styles.title}>Iniciar sesion</Text>
              <Text style={styles.subtitle}>Ingresa tus credenciales para continuar.</Text>

              <TextInput
                value={correo}
                onChangeText={setCorreo}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                placeholder="tu@correo.com"
                placeholderTextColor="#6d747f"
                style={styles.input}
              />

              <TextInput
                value={contrasena}
                onChangeText={setContrasena}
                secureTextEntry
                placeholder="Contrasena"
                placeholderTextColor="#6d747f"
                style={styles.input}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <Pressable
                onPress={onLogin}
                disabled={disabled || cargando}
                style={[styles.button, (disabled || cargando) && styles.buttonDisabled]}>
                {cargando ? (
                  <ActivityIndicator color="#0b1b1a" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </Pressable>

              <View style={styles.row}>
                <Text style={styles.rowText}>No tienes cuenta?</Text>
                <Pressable onPress={() => router.push('/crear-cuenta' as never)}>
                  <Text style={styles.link}>Crear cuenta</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 14, 0.7)',
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  card: {
    backgroundColor: 'rgba(26, 31, 37, 0.9)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a323d',
    gap: 12,
  },
  brand: {
    color: '#2cb8af',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: '#f2f5f7',
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#aeb7c2',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#364150',
    backgroundColor: '#131920',
    color: '#f2f5f7',
    paddingHorizontal: 14,
  },
  error: {
    color: '#ff9090',
    fontSize: 13,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    height: 48,
    backgroundColor: '#2cb8af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#0b1b1a',
    fontWeight: '800',
    fontSize: 16,
  },
  row: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  rowText: {
    color: '#aeb7c2',
  },
  link: {
    color: '#2cb8af',
    fontWeight: '700',
  },
});
