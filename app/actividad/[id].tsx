import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { apiFetch } from '@/lib/api';
import { resolverImagenActividad } from '@/lib/imageSource';

type Actividad = {
  _id?: string;
  id?: string;
  nombre?: string;
  descripcion?: string;
  foto?: string;
};

export default function ActividadIndividualScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const [actividad, setActividad] = useState<Actividad | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const actividadId = useMemo(() => {
    if (Array.isArray(params.id)) return params.id[0] || '';
    return params.id || '';
  }, [params.id]);

  const cargarActividad = useCallback(async () => {
    if (!actividadId) return;
    setError('');
    setCargando(true);
    try {
      const resp = await apiFetch(`/actividades/${actividadId}`);
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.mensaje || 'No se pudo cargar');
      }
      if (!data?.actividad) throw new Error('La API no devolvio actividad');
      setActividad(data.actividad);
    } catch (e: any) {
      setError(e?.message || 'Error');
      setActividad(null);
    } finally {
      setCargando(false);
    }
  }, [actividadId]);

  useEffect(() => {
    cargarActividad();
  }, [cargarActividad]);

  const fotoMostrada = resolverImagenActividad(actividad?.foto, 'fondo2.jpg', 'imagenes/fondo2.jpg');

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Volver</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Actividad</Text>
        </View>

        {cargando ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color="#2cb8af" />
            <Text style={styles.stateText}>Cargando...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : actividad ? (
          <View style={styles.card}>
            {fotoMostrada ? (
              <Image
                source={fotoMostrada}
                style={styles.image}
                onError={(e) =>
                  console.warn('[imagenes] Error al cargar imagen en detalle de actividad', {
                    fotoCampo: actividad?.foto,
                    error: e?.nativeEvent?.error,
                  })
                }
              />
            ) : (
              <View style={styles.imageFallback} />
            )}
            <View style={styles.body}>
              <Text style={styles.title}>{actividad.nombre || 'Actividad'}</Text>
              <Text style={styles.description}>{actividad.descripcion || ''}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#171717' },
  container: { flex: 1, padding: 16, backgroundColor: '#171717' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#1a1f25',
  },
  backButtonText: { color: '#f2f5f7', fontWeight: '700' },
  headerTitle: { color: '#f2f5f7', fontSize: 20, fontWeight: '800' },
  stateWrap: { marginTop: 20, alignItems: 'center', gap: 10 },
  stateText: { color: '#aeb7c2', textAlign: 'center' },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#1a1f25',
  },
  image: { width: '100%', height: 240 },
  imageFallback: { width: '100%', height: 240, backgroundColor: '#131920' },
  body: { padding: 14 },
  title: { color: '#f2f5f7', fontSize: 22, fontWeight: '800' },
  description: { marginTop: 10, color: '#aeb7c2', lineHeight: 20 },
});
