# Frontend Mobile - Gestor de Actividades (Move & Lite)

Aplicacion movil multiplataforma para gestionar actividades deportivas, reservas y perfil de usuario desde el telefono. Construida con React Native y Expo, con interfaz oscura y acentos turquesa, orientada a experiencia tactil.

## Tecnologias

- Framework: React Native 0.81 + Expo 54
- Lenguaje: TypeScript 5.9
- Navegacion: Expo Router 6 (file-based routing)
- Navegacion nativa: React Navigation 7
- Animaciones: React Native Reanimated 4
- Linting: ESLint (eslint-config-expo)

## Ejecucion

### Requisitos previos

- Node.js (LTS)
- npm
- Expo CLI via `npx expo`
- Backend API activo y accesible desde el dispositivo/emulador


## Arranque

```bash
npm install
npx expo start
```

Desde ahi puedes abrir la app en:

- `npm run android` - Emulador o dispositivo Android
- `npm run ios` - Simulador iOS (solo macOS)
- `npm run web` - Navegador (modo web)

## Pantallas de la aplicacion

### Autenticacion

- Login (`/`): acceso con `correo` y `contrasena`; guarda token en sesion de memoria y redirige a Principal.
- Crear cuenta (`/crear-cuenta`): registro con nombre, apellido, correo, telefono y contrasena.

### Panel principal

- Principal (`/principal`): listado de actividades, buscador, detalle y reserva de actividad.
- Mis reservas (`/(tabs)/mis-reservas`): lista de actividades reservadas y cancelacion (permitida solo con mas de 15 minutos de anticipacion).
- Detalle individual (`/actividad/[id]`): vista puntual de una actividad.

### Funciones por rol

- Usuario:
  - Ver actividades.
  - Reservar actividad disponible.
  - Ver y cancelar reservas con restriccion horaria.

- Admin (`rol === 'admin'`):
  - Todo lo de usuario.
  - Crear actividades.
  - Modificar actividades.
  - Eliminar actividades.

## Estructura de rutas

- `app/index.tsx` - Login
- `app/crear-cuenta.tsx` - Signup
- `app/principal.tsx` - Dashboard principal (user/admin)
- `app/(tabs)/index.tsx` - Redirect a principal
- `app/(tabs)/mis-reservas.tsx` - Reservas del usuario
- `app/actividad/[id].tsx` - Detalle de actividad

## Integracion con API

La app espera endpoints REST como:

- `POST /auth/login`
- `POST /usuarios`
- `GET /actividades`
- `GET /actividades/:id`
- `POST /reservas`
- `GET /reservas`
- `DELETE /reservas`
- `POST/PUT/DELETE /actividades` (admin)

## Notas tecnicas

- La sesion (`token` + `usuario`) se guarda en memoria (`lib/session.ts`).
- Si se reinicia la app, la sesion actual se pierde (no hay persistencia local aun).
- Las imagenes de actividades se resuelven desde assets locales o URL absoluta via `lib/imageSource.ts`.
