import { ImageSourcePropType } from 'react-native';
import { toAbsoluteImageUrl } from '@/lib/api';

const IMAGENES_LOCALES: Record<string, ImageSourcePropType> = {
  'android-icon-background.png': require('@/assets/images/android-icon-background.png'),
  'android-icon-foreground.png': require('@/assets/images/android-icon-foreground.png'),
  'android-icon-monochrome.png': require('@/assets/images/android-icon-monochrome.png'),
  'favicon.png': require('@/assets/images/favicon.png'),
  'fondo.avif': require('@/assets/images/fondo.avif'),
  'fondo2.jpg': require('@/assets/images/fondo2.jpg'),
  'fondo3.webp': require('@/assets/images/fondo3.webp'),
  'fondo4.webp': require('@/assets/images/fondo4.webp'),
  'icon.png': require('@/assets/images/icon.png'),
  'images1.jfif': require('@/assets/images/images1.jfif'),
  'kunfu.jpg': require('@/assets/images/kunfu.jpg'),
  'logout2sin.png': require('@/assets/images/logout2sin.png'),
  'partial-react-logo.png': require('@/assets/images/partial-react-logo.png'),
  'persona1.jpg': require('@/assets/images/persona1.jpg'),
  'react-logo.png': require('@/assets/images/react-logo.png'),
  'splash-icon.png': require('@/assets/images/splash-icon.png'),
};

const normalizarNombreImagen = (value?: string | null) =>
  String(value || '')
    .trim()
    .replace(/^\/+/, '')
    .replace(/^images\/+/i, '')
    .replace(/^imagenes\/+/i, '');

const DEBUG_IMAGENES = typeof __DEV__ !== 'undefined' && __DEV__;
const LOGS_EMITIDOS = new Set<string>();

const logDebugUnaVez = (nivel: 'log' | 'warn', evento: string, payload: Record<string, unknown>) => {
  if (!DEBUG_IMAGENES) return;
  const key = `${nivel}|${evento}|${JSON.stringify(payload)}`;
  if (LOGS_EMITIDOS.has(key)) return;
  LOGS_EMITIDOS.add(key);
  if (nivel === 'warn') {
    console.warn(evento, payload);
    return;
  }
  console.log(evento, payload);
};

export function resolverImagenActividad(
  path: string | null | undefined,
  fallbackLocal = 'fondo2.jpg',
  fallbackRemote = 'imagenes/fondo2.jpg'
): ImageSourcePropType | undefined {
  const nombre = normalizarNombreImagen(path);
  if (nombre && IMAGENES_LOCALES[nombre]) {
    logDebugUnaVez('log', '[imagenes] Fuente local encontrada', { path, nombre });
    return IMAGENES_LOCALES[nombre];
  }

  if (nombre) {
    logDebugUnaVez('warn', '[imagenes] Nombre no encontrado en assets/images', {
      path,
      nombre,
      sugerencia: `Agrega '${nombre}' al mapa de lib/imageSource.ts`,
    });
    if (nombre.toLowerCase().endsWith('.jfif')) {
      logDebugUnaVez('warn', '[imagenes] Extension .jfif detectada', {
        path,
        recomendacion: 'Prueba renombrar/convertir a .jpg o .png si sigue fallando.',
      });
    }
  }

  const nombreFallback = normalizarNombreImagen(fallbackLocal);
  if (nombreFallback && IMAGENES_LOCALES[nombreFallback]) {
    logDebugUnaVez('log', '[imagenes] Usando fallback local', { fallbackLocal: nombreFallback, path });
    return IMAGENES_LOCALES[nombreFallback];
  }

  const uri = toAbsoluteImageUrl(path, fallbackRemote);
  if (uri) {
    logDebugUnaVez('log', '[imagenes] Usando fuente remota', { path, uri });
  } else {
    logDebugUnaVez('warn', '[imagenes] No se pudo resolver fuente', { path, fallbackLocal, fallbackRemote });
  }
  return uri ? { uri } : undefined;
}
