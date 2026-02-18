import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch } from '@/lib/api';
import { resolverImagenActividad } from '@/lib/imageSource';
import { getUsuario } from '@/lib/session';

type Actividad = {
  _id?: string;
  id?: string;
  nombre?: string;
  descripcion?: string;
  dia?: string;
  hora?: string;
  foto?: string;
};

const MINUTOS_PARA_CANCELAR = 15;

export default function MisReservasScreen() {
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [reservasIds, setReservasIds] = useState<Set<string>>(new Set());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const cargarDatos = useCallback(async () => {
    setError('');
    setCargando(true);
    try {
      const usuario = getUsuario();
      const uid = usuario?.id || usuario?._id;
      if (!uid) throw new Error('Debes iniciar sesion');

      const [respAct, respRes] = await Promise.all([apiFetch('/actividades'), apiFetch('/reservas')]);
      const dataAct = await respAct.json();
      const dataRes = await respRes.json();

      if (!respAct.ok || !dataAct?.ok) {
        throw new Error(dataAct?.mensaje || 'Error cargando actividades');
      }
      if (!respRes.ok || !dataRes?.ok) {
        throw new Error(dataRes?.mensaje || 'Error cargando reservas');
      }

      setActividades(dataAct.actividades || []);
      setReservasIds(new Set((dataRes.reservas || []).map((r: any) => String(r.actividadId))));
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  const getInicioActividad = (actividad: Actividad) => {
    if (!actividad.dia || !actividad.hora) return null;
    const inicio = new Date(`${actividad.dia}T${actividad.hora}`);
    if (Number.isNaN(inicio.getTime())) return null;
    return inicio;
  };

  const puedeCancelarReserva = (actividad: Actividad) => {
    const inicio = getInicioActividad(actividad);
    if (!inicio) return false;
    const diffMin = (inicio.getTime() - Date.now()) / 60000;
    return diffMin > MINUTOS_PARA_CANCELAR;
  };

  const mensajeCancelacion = (actividad: Actividad) => {
    const inicio = getInicioActividad(actividad);
    if (!inicio) return 'No se puede cancelar: actividad sin fecha u hora valida.';
    const diffMin = Math.round((inicio.getTime() - Date.now()) / 60000);
    if (diffMin < 0) return 'No se puede cancelar: la actividad ya comenzo.';
    return `No se puede cancelar con ${MINUTOS_PARA_CANCELAR} minutos o menos de anticipacion.`;
  };

  const cancelarReserva = async (actividadId: string) => {
    try {
      const resp = await apiFetch('/reservas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actividadId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.mensaje || 'No se pudo cancelar');
      }
      await cargarDatos();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error');
    }
  };

  const solicitarCancelarReserva = (actividad: Actividad) => {
    if (!puedeCancelarReserva(actividad)) {
      Alert.alert('No disponible', mensajeCancelacion(actividad));
      return;
    }

    const actividadId = String(actividad._id || actividad.id || '');
    if (!actividadId) return;

    Alert.alert('Cancelar reserva', 'Seguro que quieres cancelar esta reserva?', [
      { text: 'Volver', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: () => cancelarReserva(actividadId) },
    ]);
  };

  const actividadesReservadas = useMemo(() => {
    return actividades.filter((a) => reservasIds.has(String(a._id || a.id)));
  }, [actividades, reservasIds]);

  const renderItem = ({ item }: { item: Actividad }) => {
    const foto = resolverImagenActividad(item.foto, 'fondo2.jpg', 'imagenes/fondo2.jpg');
    return (
      <View style={styles.card}>
        {foto ? (
          <Image
            source={foto}
            style={styles.image}
            onError={(e) =>
              console.warn('[imagenes] Error al cargar imagen en Mis Reservas', {
                fotoCampo: item?.foto,
                error: e?.nativeEvent?.error,
              })
            }
          />
        ) : (
          <View style={styles.imageFallback} />
        )}
        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.title}>{item.nombre || 'Actividad'}</Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Reservado</Text>
            </View>
          </View>
          {!!item.descripcion && <Text style={styles.description}>{item.descripcion}</Text>}
          <View style={styles.metaRow}>
            {!!item.dia && <Text style={styles.meta}>Dia: {item.dia}</Text>}
            {!!item.hora && <Text style={styles.meta}>Hora: {item.hora}</Text>}
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={() => solicitarCancelarReserva(item)}
              disabled={!puedeCancelarReserva(item)}
              style={[styles.cancelButton, !puedeCancelarReserva(item) && styles.cancelButtonDisabled]}>
              <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mis reservas</Text>
            <Text style={styles.headerSubtitle}>Tus actividades reservadas</Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)' as never)} style={styles.navButton}>
            <Text style={styles.navButtonText}>Principal</Text>
          </Pressable>
        </View>

        {cargando ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color="#2cb8af" />
            <Text style={styles.stateText}>Cargando reservas...</Text>
          </View>
        ) : error ? (
          <View style={styles.stateWrap}>
            <Text style={styles.stateText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={actividadesReservadas}
            keyExtractor={(item) => String(item._id || item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<Text style={styles.stateText}>Todavia no tienes reservas.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#171717' },
  container: { flex: 1, padding: 16, backgroundColor: '#171717' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.35)',
    backgroundColor: 'rgba(44,184,175,0.1)',
  },
  headerTitle: { color: '#f2f5f7', fontSize: 22, fontWeight: '800' },
  headerSubtitle: { color: '#aeb7c2', marginTop: 4 },
  navButton: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2cb8af',
    backgroundColor: 'rgba(44,184,175,0.15)',
  },
  navButtonText: { color: '#2cb8af', fontWeight: '700' },
  list: { gap: 12, paddingBottom: 22 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#1a1f25',
  },
  image: { width: '100%', height: 160 },
  imageFallback: { width: '100%', height: 160, backgroundColor: '#131920' },
  body: { padding: 12, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { color: '#f2f5f7', fontSize: 16, fontWeight: '800', flex: 1 },
  chip: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipText: { color: '#f4f2ee', fontSize: 12, fontWeight: '700' },
  description: { color: '#aeb7c2' },
  metaRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  meta: { color: '#aeb7c2', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  cancelButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,120,120,0.35)',
    backgroundColor: 'rgba(255,120,120,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonDisabled: { opacity: 0.55 },
  cancelButtonText: { color: '#ffe5e5', fontSize: 12, fontWeight: '700' },
  stateWrap: { marginTop: 20, alignItems: 'center', gap: 10 },
  stateText: { color: '#aeb7c2', textAlign: 'center' },
});
