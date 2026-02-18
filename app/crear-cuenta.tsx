import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

export default function CrearCuentaScreen() {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const contrasenasCoinciden = contrasena === confirmarContrasena;

  const disabled = useMemo(
    () =>
      !nombre.trim() ||
      !apellido.trim() ||
      !correo.trim() ||
      contrasena.length < 8 ||
      !contrasenasCoinciden ||
      cargando,
    [nombre, apellido, correo, contrasena, contrasenasCoinciden, cargando]
  );

  const onRegistro = async () => {
    if (disabled) return;

    setError('');
    setCargando(true);

    try {
      const resp = await fetch(`${API_BASE_URL}/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          correo: correo.trim().toLowerCase(),
          telefono: telefono.trim(),
          contrasena,
        }),
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        setError(data?.mensaje || `Error HTTP ${resp.status}`);
        return;
      }

      router.replace('/');
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
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={styles.card}>
                <Text style={styles.brand}>Move & Lite</Text>
                <Text style={styles.title}>Crear cuenta</Text>
                <Text style={styles.subtitle}>Completa tus datos para registrarte.</Text>

                <TextInput
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Nombre"
                  placeholderTextColor="#6d747f"
                  style={styles.input}
                />
                <TextInput
                  value={apellido}
                  onChangeText={setApellido}
                  placeholder="Apellido"
                  placeholderTextColor="#6d747f"
                  style={styles.input}
                />
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
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                  placeholder="Telefono"
                  placeholderTextColor="#6d747f"
                  style={styles.input}
                />
                <TextInput
                  value={contrasena}
                  onChangeText={setContrasena}
                  secureTextEntry
                  placeholder="Contrasena (minimo 8)"
                  placeholderTextColor="#6d747f"
                  style={styles.input}
                />
                <TextInput
                  value={confirmarContrasena}
                  onChangeText={setConfirmarContrasena}
                  secureTextEntry
                  placeholder="Confirmar contrasena"
                  placeholderTextColor="#6d747f"
                  style={styles.input}
                />

                {!contrasenasCoinciden && confirmarContrasena.length > 0 && (
                  <Text style={styles.error}>Las contrasenas no coinciden.</Text>
                )}
                {!!error && <Text style={styles.error}>{error}</Text>}

                <Pressable
                  onPress={onRegistro}
                  disabled={disabled}
                  style={[styles.button, disabled && styles.buttonDisabled]}>
                  {cargando ? (
                    <ActivityIndicator color="#0b1b1a" />
                  ) : (
                    <Text style={styles.buttonText}>Crear cuenta</Text>
                  )}
                </Pressable>

                <View style={styles.row}>
                  <Text style={styles.rowText}>Ya tienes cuenta?</Text>
                  <Pressable onPress={() => router.replace('/')}>
                    <Text style={styles.link}>Volver al login</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
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
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
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
