import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { apiFetch, toAbsoluteImageUrl } from '@/lib/api';
import { resolverImagenActividad } from '@/lib/imageSource';
import { clearSession, getUsuario } from '@/lib/session';

type Actividad = {
  _id?: string;
  id?: string;
  nombre?: string;
  descripcion?: string;
  dia?: string;
  hora?: string;
  foto?: string;
  llena?: boolean;
  maximoPersonas?: number;
};

type Usuario = {
  id?: string;
  _id?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;
	rol?: string;
	foto?: string;
} | null;

const NOMBRES_DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatearFechaISO(fecha: Date) {
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseFechaISO(valor: string) {
  const match = valor.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const fecha = new Date(year, month - 1, day);
  if (
    fecha.getFullYear() !== year ||
    fecha.getMonth() !== month - 1 ||
    fecha.getDate() !== day
  ) {
    return null;
  }
  return fecha;
}

export default function PrincipalScreen() {
  const [usuario, setUsuario] = useState<Usuario>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [cargandoAct, setCargandoAct] = useState(false);
  const [errorAct, setErrorAct] = useState('');
  const [reservasIds, setReservasIds] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState('');

  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [msgReserva, setMsgReserva] = useState('');

  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  const [editId, setEditId] = useState('');
  const [nuevaNombre, setNuevaNombre] = useState('');
  const [nuevaFoto, setNuevaFoto] = useState('');
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [nuevaDia, setNuevaDia] = useState('');
  const [nuevaHora, setNuevaHora] = useState('');
  const [nuevaMaximo, setNuevaMaximo] = useState('');
  const [mostrarCalendarioDia, setMostrarCalendarioDia] = useState(false);
  const [mostrarSelectorHora, setMostrarSelectorHora] = useState(false);
  const [mesCalendario, setMesCalendario] = useState(() => {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  });
  const [creando, setCreando] = useState(false);
  const [msgCrear, setMsgCrear] = useState('');

  const cargarActividades = useCallback(async () => {
    setErrorAct('');
    setCargandoAct(true);
    try {
      const resp = await apiFetch('/actividades');
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.mensaje || 'Error cargando actividades');
      }
      setActividades(data?.actividades || []);
    } catch (e: any) {
      setErrorAct(e?.message || 'Error');
      setActividades([]);
    } finally {
      setCargandoAct(false);
    }
  }, []);

  const cargarReservas = useCallback(async () => {
    const currentUser = (getUsuario() as Usuario) || null;
    const uid = currentUser?.id || currentUser?._id;
    if (!uid) {
      setReservasIds(new Set());
      return;
    }
    try {
      const resp = await apiFetch(`/reservas?usuarioId=${encodeURIComponent(uid)}`);
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.mensaje || 'Error cargando reservas');
      }
      setReservasIds(new Set((data?.reservas || []).map((r: any) => String(r.actividadId))));
    } catch {
      setReservasIds(new Set());
    }
  }, []);

  const cargarTodo = useCallback(async () => {
    setUsuario((getUsuario() as Usuario) || null);
    await Promise.all([cargarActividades(), cargarReservas()]);
  }, [cargarActividades, cargarReservas]);

  useFocusEffect(
    useCallback(() => {
      cargarTodo();
    }, [cargarTodo])
  );

  const actividadesFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return actividades;
    return actividades.filter((a) => String(a.nombre || '').toLowerCase().includes(q));
  }, [actividades, busqueda]);

  const nombreMostrado = useMemo(() => {
    if (!usuario) return 'Usuario';
    if (usuario.nombre && usuario.apellido) return `${usuario.nombre} ${usuario.apellido}`;
    if (usuario.nombre) return usuario.nombre;
    if (usuario.correo) return usuario.correo;
    return 'Usuario';
  }, [usuario]);

  const fotoMostrada = useMemo(
    () => toAbsoluteImageUrl(usuario?.foto, 'imagenes/persona1.jpg'),
    [usuario?.foto]
  );
  const esAdmin = usuario?.rol === 'admin';

  const cerrarSesion = () => {
    clearSession();
    setUsuario(null);
    router.replace('/');
  };

  const irMisReservas = () => {
    router.push('/mis-reservas' as never);
  };

  const abrirActividad = (actividad: Actividad) => {
    setActividadSeleccionada(actividad);
    setMsgReserva('');
    setMostrarModalDetalle(true);
  };

  const cerrarActividad = () => {
    if (reservando) return;
    setMostrarModalDetalle(false);
    setActividadSeleccionada(null);
    setMsgReserva('');
  };

  const reservarActividad = async () => {
    const act = actividadSeleccionada;
    const actId = String(act?._id || act?.id || '');
    if (!actId) {
      setMsgReserva('Actividad invalida.');
      return;
    }
    if (reservasIds.has(actId)) {
      setMsgReserva('Ya estas reservado en esta actividad.');
      return;
    }
    if (act?.llena) {
      setMsgReserva('No hay plazas disponibles para esta actividad.');
      return;
    }
    if (!usuario?.id && !usuario?._id) {
      setMsgReserva('Debes iniciar sesion para reservar.');
      return;
    }

    setReservando(true);
    setMsgReserva('');
    try {
      const resp = await apiFetch('/reservas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actividadId: actId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.mensaje || 'No se pudo reservar');
      }

      await cargarTodo();
      setMsgReserva('Reserva confirmada');
      setMostrarModalDetalle(false);
      setActividadSeleccionada(null);
    } catch (e: any) {
      setMsgReserva(e?.message || 'Error');
    } finally {
      setReservando(false);
    }
  };

  const abrirModalCrear = () => {
    setMsgCrear('');
    setEsEdicion(false);
    setEditId('');
    setNuevaNombre('');
    setNuevaFoto('');
    setNuevaDescripcion('');
    setNuevaDia('');
    setNuevaHora('');
    setNuevaMaximo('');
    const hoy = new Date();
    setMesCalendario(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    setMostrarCalendarioDia(false);
    setMostrarSelectorHora(false);
    setMostrarModalCrear(true);
  };

  const abrirModalEditar = (actividad: Actividad) => {
    setMsgCrear('');
    setEsEdicion(true);
    setEditId(String(actividad?._id || actividad?.id || ''));
    setNuevaNombre(String(actividad?.nombre || ''));
    setNuevaFoto(String(actividad?.foto || ''));
    setNuevaDescripcion(String(actividad?.descripcion || ''));
    const diaActual = String(actividad?.dia || '');
    setNuevaDia(diaActual);
    setNuevaHora(String(actividad?.hora || ''));
    setNuevaMaximo(
      actividad?.maximoPersonas !== null && actividad?.maximoPersonas !== undefined
        ? String(actividad.maximoPersonas)
        : ''
    );
    const fechaEditada = parseFechaISO(diaActual);
    const base = fechaEditada || new Date();
    setMesCalendario(new Date(base.getFullYear(), base.getMonth(), 1));
    setMostrarCalendarioDia(false);
    setMostrarSelectorHora(false);
    setMostrarModalCrear(true);
  };

  const cerrarModalCrear = () => {
    if (creando) return;
    setMostrarCalendarioDia(false);
    setMostrarSelectorHora(false);
    setMostrarModalCrear(false);
  };

  const cambiarMesCalendario = (delta: number) => {
    setMesCalendario((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const seleccionarDiaCalendario = (diaDelMes: number) => {
    const fechaSeleccionada = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), diaDelMes);
    setNuevaDia(formatearFechaISO(fechaSeleccionada));
    setMostrarCalendarioDia(false);
  };

  const HORAS_DISPONIBLES = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
    []
  );
  const MINUTOS_DISPONIBLES = useMemo(
    () => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')),
    []
  );
  const horaSeleccionada = nuevaHora.includes(':') ? nuevaHora.split(':')[0] : '';
  const minutoSeleccionado = nuevaHora.includes(':') ? nuevaHora.split(':')[1] : '';

  const guardarActividad = async () => {
    setMsgCrear('');
    if (!nuevaNombre.trim() || !nuevaDescripcion.trim()) {
      setMsgCrear('Nombre y descripcion son obligatorios.');
      return;
    }

    setCreando(true);
    try {
      const esEdit = esEdicion && !!editId;
      const url = esEdit ? `/actividades/${editId}` : '/actividades';
      const method = esEdit ? 'PUT' : 'POST';

      const payload: Record<string, any> = {
        nombre: nuevaNombre.trim(),
        foto: nuevaFoto.trim(),
        descripcion: nuevaDescripcion.trim(),
        dia: nuevaDia.trim(),
        hora: nuevaHora.trim(),
        maximoPersonas: nuevaMaximo.trim(),
      };

      const resp = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.mensaje || 'No se pudo guardar');
      }

      setMsgCrear(esEdit ? 'Actividad actualizada' : 'Actividad creada');
      await cargarTodo();
      setMostrarModalCrear(false);
    } catch (e: any) {
      setMsgCrear(e?.message || 'Error');
    } finally {
      setCreando(false);
    }
  };

  const eliminarActividad = async (actividad: Actividad) => {
    const id = String(actividad?._id || actividad?.id || '');
    if (!id) return;
    try {
      const resp = await apiFetch(`/actividades/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok || !data?.ok) {
        throw new Error(data?.mensaje || 'No se pudo eliminar');
      }
      await cargarTodo();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Error');
    }
  };

  const solicitarEliminarActividad = (actividad: Actividad) => {
    Alert.alert(
      'Eliminar actividad',
      'Seguro que quieres eliminar esta actividad? Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => eliminarActividad(actividad) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Actividad }) => {
    const id = String(item?._id || item?.id || '');
    const foto = resolverImagenActividad(item?.foto, 'fondo2.jpg', 'imagenes/fondo2.jpg');
    const reservada = reservasIds.has(id);

    return (
      <View style={styles.card}>
        {foto ? (
          <Image
            source={foto}
            style={styles.cardImage}
            onError={(e) =>
              console.warn('[imagenes] Error al cargar imagen de tarjeta', {
                fotoCampo: item?.foto,
                error: e?.nativeEvent?.error,
              })
            }
          />
        ) : (
          <View style={styles.cardImageFallback} />
        )}
        <View style={styles.cardBody}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{item?.nombre || 'Actividad'}</Text>
            {reservada && (
              <View style={[styles.chip, styles.chipReservado]}>
                <Text style={styles.chipText}>Reservado</Text>
              </View>
            )}
          </View>
          {!!item?.descripcion && <Text style={styles.cardDescription}>{item.descripcion}</Text>}
          <View style={styles.metaRow}>
            {!!item?.dia && <Text style={styles.metaItem}>Dia: {item.dia}</Text>}
            {!!item?.hora && <Text style={styles.metaItem}>Hora: {item.hora}</Text>}
          </View>
          <View style={styles.actionsRow}>
            <Pressable onPress={() => abrirActividad(item)} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>Ver detalles</Text>
            </Pressable>
            {esAdmin && (
              <Pressable onPress={() => abrirModalEditar(item)} style={[styles.actionBtn, styles.editBtn]}>
                <Text style={styles.editBtnText}>Modificar</Text>
              </Pressable>
            )}
            {esAdmin && (
              <Pressable
                onPress={() => solicitarEliminarActividad(item)}
                style={[styles.actionBtn, styles.deleteBtn]}>
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  const actividadIdActual = String(actividadSeleccionada?._id || actividadSeleccionada?.id || '');
  const actividadReservada = reservasIds.has(actividadIdActual);
  const actividadLlena = !!actividadSeleccionada?.llena;
  const fotoDetalle = resolverImagenActividad(actividadSeleccionada?.foto, 'fondo2.jpg', 'imagenes/fondo2.jpg');
  const primerDiaSemana = useMemo(() => {
    const weekday = new Date(mesCalendario.getFullYear(), mesCalendario.getMonth(), 1).getDay();
    return weekday === 0 ? 6 : weekday - 1;
  }, [mesCalendario]);
  const diasEnMes = useMemo(
    () => new Date(mesCalendario.getFullYear(), mesCalendario.getMonth() + 1, 0).getDate(),
    [mesCalendario]
  );
  const celdasCalendario = useMemo(() => {
    const celdas: (number | null)[] = [];
    for (let i = 0; i < primerDiaSemana; i += 1) celdas.push(null);
    for (let dia = 1; dia <= diasEnMes; dia += 1) celdas.push(dia);
    while (celdas.length % 7 !== 0) celdas.push(null);
    return celdas;
  }, [primerDiaSemana, diasEnMes]);
  const fechaSeleccionada = useMemo(() => parseFechaISO(nuevaDia), [nuevaDia]);
  const hayDiaSeleccionadoEnMes = Boolean(
    fechaSeleccionada &&
      fechaSeleccionada.getFullYear() === mesCalendario.getFullYear() &&
      fechaSeleccionada.getMonth() === mesCalendario.getMonth()
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topbar}>
          <View style={styles.topbarHeader}>
            <View>
              <Text style={styles.topbarTitle}>Principal</Text>
              <Text style={styles.topbarSubtitle}>Bienvenido/a a tu panel</Text>
            </View>
            {esAdmin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>

          <View style={styles.userCard}>
            {fotoMostrada ? (
              <Image source={{ uri: fotoMostrada }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarFallback} />
            )}
            <View style={styles.userCardBody}>
              <Text style={styles.userLabel}>Usuario</Text>
              <Text style={styles.userName}>{nombreMostrado}</Text>
              {!!usuario?.correo && <Text style={styles.userEmail}>{usuario.correo}</Text>}
            </View>
          </View>

          <View style={styles.topbarActions}>
            <Pressable onPress={irMisReservas} style={[styles.navButton, styles.navButtonPrimary]}>
              <Text style={styles.navButtonText}>Mis reservas</Text>
            </Pressable>
            <Pressable onPress={cerrarSesion} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Salir</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Actividades</Text>
              <Text style={styles.sectionText}>Elegi una actividad para ver mas informacion.</Text>
            </View>
            <TextInput
              value={busqueda}
              onChangeText={setBusqueda}
              style={styles.searchInput}
              placeholder="Buscar actividad..."
              placeholderTextColor="#8f97a2"
            />
          </View>

          {cargandoAct ? (
            <View style={styles.stateWrap}>
              <ActivityIndicator color="#2cb8af" />
              <Text style={styles.stateText}>Cargando actividades...</Text>
            </View>
          ) : errorAct ? (
            <View style={styles.stateWrap}>
              <Text style={styles.stateText}>{errorAct}</Text>
            </View>
          ) : (
            <FlatList
              data={actividadesFiltradas}
              keyExtractor={(item) => String(item?._id || item?.id)}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.stateText}>No se encontraron actividades.</Text>}
            />
          )}
        </View>

        {esAdmin && (
          <Pressable onPress={abrirModalCrear} style={styles.fabCreateButton}>
            <Text style={styles.fabCreateButtonText}>Crear actividad</Text>
          </Pressable>
        )}
      </View>

      <Modal visible={mostrarModalDetalle} animationType="fade" transparent onRequestClose={cerrarActividad}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{actividadSeleccionada?.nombre || 'Actividad'}</Text>
              <Pressable onPress={cerrarActividad} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>X</Text>
              </Pressable>
            </View>

            {fotoDetalle ? (
              <Image
                source={fotoDetalle}
                style={styles.detailImage}
                onError={(e) =>
                  console.warn('[imagenes] Error al cargar imagen de detalle', {
                    fotoCampo: actividadSeleccionada?.foto,
                    error: e?.nativeEvent?.error,
                  })
                }
              />
            ) : null}
            {!!actividadSeleccionada?.descripcion && (
              <Text style={styles.detailDescription}>{actividadSeleccionada.descripcion}</Text>
            )}
            <View style={styles.metaRow}>
              {!!actividadSeleccionada?.dia && (
                <Text style={styles.metaItem}>Dia: {actividadSeleccionada.dia}</Text>
              )}
              {!!actividadSeleccionada?.hora && (
                <Text style={styles.metaItem}>Hora: {actividadSeleccionada.hora}</Text>
              )}
              {actividadReservada && (
                <View style={[styles.chip, styles.chipReservado]}>
                  <Text style={styles.chipText}>Ya reservado</Text>
                </View>
              )}
              {actividadLlena && (
                <View style={[styles.chip, styles.chipLlena]}>
                  <Text style={styles.chipText}>Actividad completa</Text>
                </View>
              )}
            </View>

            {actividadReservada ? (
              <Text style={styles.noticeText}>Ya estas reservado en esta actividad.</Text>
            ) : actividadLlena ? (
              <Text style={styles.noticeText}>No hay plazas disponibles para esta actividad.</Text>
            ) : (
              <Pressable onPress={reservarActividad} disabled={reservando} style={styles.reserveButton}>
                <Text style={styles.reserveButtonText}>{reservando ? 'Reservando...' : 'Reservar'}</Text>
              </Pressable>
            )}
            {!!msgReserva && <Text style={styles.modalMessage}>{msgReserva}</Text>}
          </View>
        </View>
      </Modal>

      <Modal visible={mostrarModalCrear} animationType="fade" transparent onRequestClose={cerrarModalCrear}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{esEdicion ? 'Modificar actividad' : 'Crear actividad'}</Text>
              <Pressable onPress={cerrarModalCrear} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>X</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              <TextInput
                value={nuevaNombre}
                onChangeText={setNuevaNombre}
                style={styles.formInput}
                placeholder="Nombre (ej: Pilates)"
                placeholderTextColor="#8f97a2"
              />
              <TextInput
                value={nuevaFoto}
                onChangeText={setNuevaFoto}
                style={styles.formInput}
                placeholder="Imagen local (ej: /fondo2.jpg)"
                placeholderTextColor="#8f97a2"
              />
              <TextInput
                value={nuevaDescripcion}
                onChangeText={setNuevaDescripcion}
                style={styles.formInput}
                placeholder="Descripcion"
                placeholderTextColor="#8f97a2"
              />
              <Pressable
                onPress={() => {
                  setMostrarSelectorHora(false);
                  setMostrarCalendarioDia((prev) => !prev);
                }}
                style={[styles.formInput, styles.dateInputButton]}>
                <Text style={nuevaDia ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {nuevaDia || 'Dia (YYYY-MM-DD)'}
                </Text>
              </Pressable>
              {mostrarCalendarioDia && (
                <View style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <Pressable onPress={() => cambiarMesCalendario(-1)} style={styles.calendarNavButton}>
                      <Text style={styles.calendarNavButtonText}>{'<'}</Text>
                    </Pressable>
                    <Text style={styles.calendarMonthText}>
                      {NOMBRES_MESES[mesCalendario.getMonth()]} {mesCalendario.getFullYear()}
                    </Text>
                    <Pressable onPress={() => cambiarMesCalendario(1)} style={styles.calendarNavButton}>
                      <Text style={styles.calendarNavButtonText}>{'>'}</Text>
                    </Pressable>
                  </View>
                  <View style={styles.calendarWeekRow}>
                    {NOMBRES_DIAS.map((nombreDia) => (
                      <Text key={nombreDia} style={styles.calendarWeekLabel}>
                        {nombreDia}
                      </Text>
                    ))}
                  </View>
                  <View style={styles.calendarGrid}>
                    {celdasCalendario.map((dia, idx) => {
                      if (dia === null) {
                        return <View key={`empty-${idx}`} style={[styles.calendarDayCell, styles.calendarDayEmpty]} />;
                      }
                      const seleccionado =
                        hayDiaSeleccionadoEnMes && fechaSeleccionada && fechaSeleccionada.getDate() === dia;
                      return (
                        <View key={`day-${dia}-${idx}`} style={styles.calendarDayCell}>
                          <Pressable
                            onPress={() => seleccionarDiaCalendario(dia)}
                            style={[styles.calendarDayButton, seleccionado && styles.calendarDaySelected]}>
                            <Text
                              style={[
                                styles.calendarDayText,
                                seleccionado && styles.calendarDayTextSelected,
                              ]}>
                              {dia}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
              <Pressable
                onPress={() => {
                  setMostrarCalendarioDia(false);
                  setMostrarSelectorHora((prev) => !prev);
                }}
                style={[styles.formInput, styles.dateInputButton]}>
                <Text style={nuevaHora ? styles.dateInputText : styles.dateInputPlaceholder}>
                  {nuevaHora || 'Hora (HH:mm)'}
                </Text>
              </Pressable>
              {mostrarSelectorHora && (
                <View style={styles.timeDropdown}>
                  <View style={styles.timeColumns}>
                    <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                      {HORAS_DISPONIBLES.map((hora) => {
                        const seleccionado = hora === horaSeleccionada;
                        return (
                          <Pressable
                            key={hora}
                            onPress={() => {
                              const minuto = minutoSeleccionado || '00';
                              setNuevaHora(`${hora}:${minuto}`);
                            }}
                            style={[styles.timeOption, seleccionado && styles.timeOptionSelected]}>
                            <Text style={[styles.timeOptionText, seleccionado && styles.timeOptionTextSelected]}>
                              {hora}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                    <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
                      {MINUTOS_DISPONIBLES.map((minuto) => {
                        const seleccionado = minuto === minutoSeleccionado;
                        return (
                          <Pressable
                            key={minuto}
                            onPress={() => {
                              const hora = horaSeleccionada || '00';
                              setNuevaHora(`${hora}:${minuto}`);
                              setMostrarSelectorHora(false);
                            }}
                            style={[styles.timeOption, seleccionado && styles.timeOptionSelected]}>
                            <Text style={[styles.timeOptionText, seleccionado && styles.timeOptionTextSelected]}>
                              {minuto}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
              )}
              <TextInput
                value={nuevaMaximo}
                onChangeText={setNuevaMaximo}
                style={styles.formInput}
                keyboardType="number-pad"
                placeholder="Maximo de personas"
                placeholderTextColor="#8f97a2"
              />
            </ScrollView>

	            <View style={styles.formActions}>
	              <Pressable onPress={cerrarModalCrear} disabled={creando} style={styles.secondaryFormButton}>
	                <Text style={styles.secondaryFormButtonText}>Cancelar</Text>
	              </Pressable>
	              <Pressable onPress={guardarActividad} disabled={creando} style={styles.adminMainButton}>
	                <Text style={styles.adminMainButtonText}>
	                  {creando ? 'Guardando...' : esEdicion ? 'Guardar' : 'Crear'}
	                </Text>
	              </Pressable>
	            </View>
            {!!msgCrear && <Text style={styles.modalMessage}>{msgCrear}</Text>}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#171717' },
  container: { flex: 1, padding: 14, backgroundColor: '#171717' },
  topbar: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.22)',
    backgroundColor: 'rgba(44,184,175,0.08)',
    padding: 16,
    gap: 12,
  },
  topbarHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  topbarTitle: { color: '#f2f5f7', fontSize: 22, fontWeight: '800' },
  topbarSubtitle: { color: '#aeb7c2', marginTop: 4, fontSize: 13 },
  userCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.18)',
    backgroundColor: 'rgba(6,12,16,0.55)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  userAvatar: { width: 52, height: 52, borderRadius: 14 },
  userAvatarFallback: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#1a1f25' },
  userCardBody: { flex: 1, gap: 2, paddingTop: 2 },
  userLabel: { fontSize: 11, color: '#7ed8d2', textTransform: 'uppercase' },
  userName: { color: '#f2f5f7', fontWeight: '800', fontSize: 15 },
  userEmail: { color: '#9ca8b5', fontSize: 12 },
  adminBadge: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(44,184,175,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.28)',
  },
  adminBadgeText: { color: '#7ed8d2', fontSize: 10, fontWeight: '800' },
  topbarActions: { flexDirection: 'row', gap: 10 },
  navButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.35)',
    backgroundColor: 'rgba(44,184,175,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonPrimary: {
    backgroundColor: '#1d5450',
    borderColor: '#2cb8af',
  },
  navButtonText: { color: '#2cb8af', fontWeight: '800' },
  logoutButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#394452',
    backgroundColor: '#202834',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: { color: '#f2f5f7', fontWeight: '700' },
  section: {
    flex: 1,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 12,
  },
  sectionHeader: { gap: 10 },
  sectionTitle: { color: '#f2f5f7', fontSize: 18, fontWeight: '800' },
  sectionText: { color: '#aeb7c2', fontSize: 13 },
  searchInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#131920',
    color: '#f2f5f7',
    paddingHorizontal: 12,
  },
  adminMainButton: {
    flex: 1.2,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.35)',
    backgroundColor: 'rgba(44,184,175,0.15)',
    paddingVertical: 13,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminMainButtonText: { color: '#2cb8af', fontWeight: '800', fontSize: 16 },
  fabCreateButton: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.35)',
    backgroundColor: '#162b2a',
    paddingHorizontal: 16,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabCreateButtonText: { color: '#2cb8af', fontWeight: '800' },
  listContent: { gap: 12, paddingTop: 14, paddingBottom: 24 },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#1a1f25',
  },
  cardImage: { width: '100%', height: 150 },
  cardImageFallback: { width: '100%', height: 150, backgroundColor: '#131920' },
  cardBody: { padding: 12, gap: 8 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { color: '#f2f5f7', fontSize: 16, fontWeight: '800', flex: 1 },
  cardDescription: { color: '#aeb7c2', fontSize: 13 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  metaItem: {
    color: '#aeb7c2',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  actionBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.3)',
    backgroundColor: 'rgba(44,184,175,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionBtnText: { color: '#2cb8af', fontSize: 12, fontWeight: '700' },
  editBtn: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)' },
  editBtnText: { color: '#f4f2ee', fontSize: 12, fontWeight: '700' },
  deleteBtn: {
    borderColor: 'rgba(255,120,120,0.35)',
    backgroundColor: 'rgba(255,120,120,0.15)',
  },
  deleteBtnText: { color: '#ffe5e5', fontSize: 12, fontWeight: '700' },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipReservado: { borderColor: 'rgba(255,255,255,0.2)' },
  chipLlena: { borderColor: 'rgba(255,120,120,0.35)', backgroundColor: 'rgba(255,120,120,0.15)' },
  chipText: { color: '#f2f5f7', fontSize: 12, fontWeight: '700' },
  stateWrap: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  stateText: { color: '#aeb7c2', textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    maxHeight: '90%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.25)',
    backgroundColor: '#14171d',
    padding: 14,
    gap: 10,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: '#f2f5f7', fontWeight: '800', fontSize: 16, flex: 1, marginRight: 10 },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#1a1f25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseButtonText: { color: '#f2f5f7', fontWeight: '700' },
  detailImage: { width: '100%', height: 190, borderRadius: 12, backgroundColor: '#131920' },
  detailDescription: { color: '#aeb7c2', lineHeight: 20 },
  reserveButton: {
    marginTop: 8,
    borderRadius: 12,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(44,184,175,0.35)',
    backgroundColor: 'rgba(44,184,175,0.15)',
  },
  reserveButtonText: { color: '#2cb8af', fontWeight: '800' },
  noticeText: { color: '#aeb7c2', marginTop: 4 },
  modalMessage: { color: '#aeb7c2', marginTop: 4 },
  formScroll: { maxHeight: 300 },
  formInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#131920',
    color: '#f2f5f7',
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dateInputButton: { justifyContent: 'center' },
  dateInputText: { color: '#f2f5f7' },
  dateInputPlaceholder: { color: '#8f97a2' },
  calendarCard: {
    marginTop: -2,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#131920',
    padding: 10,
    gap: 6,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarNavButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a323d',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1f25',
  },
  calendarNavButtonText: { color: '#f2f5f7', fontWeight: '700' },
  calendarMonthText: { color: '#f2f5f7', fontWeight: '700' },
  calendarWeekRow: { flexDirection: 'row', marginTop: 4 },
  calendarWeekLabel: {
    width: '14.285%',
    textAlign: 'center',
    color: '#8f97a2',
    fontSize: 11,
    fontWeight: '700',
  },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDayCell: { width: '14.285%', alignItems: 'center', marginVertical: 2 },
  calendarDayEmpty: { height: 32 },
  calendarDayButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDaySelected: { backgroundColor: '#2cb8af' },
  calendarDayText: { color: '#f2f5f7', fontSize: 12 },
  calendarDayTextSelected: { color: '#11181f', fontWeight: '800' },
  formActions: { flexDirection: 'row', gap: 10 },
  secondaryFormButton: {
    flex: 0.8,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#1a1f25',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryFormButtonText: { color: '#f2f5f7', fontWeight: '700' },
  timeDropdown: {
    marginTop: -2,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a323d',
    backgroundColor: '#131920',
    maxHeight: 180,
  },
  timeColumns: { flexDirection: 'row' },
  timeColumn: { flex: 1 },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2731',
  },
  timeOptionSelected: { backgroundColor: 'rgba(44,184,175,0.18)' },
  timeOptionText: { color: '#f2f5f7', fontSize: 14 },
  timeOptionTextSelected: { color: '#7ed8d2', fontWeight: '800' },
});
