type UsuarioSesion = {
  id?: string;
  _id?: string;
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  rol?: string;
} | null;

let accessToken: string | null = null;
let usuarioActual: UsuarioSesion = null;

export function setSession(token: string, usuario: UsuarioSesion) {
  accessToken = token || null;
  usuarioActual = usuario;
}

export function clearSession() {
  accessToken = null;
  usuarioActual = null;
}

export function getAccessToken() {
  return accessToken;
}

export function getUsuario() {
  return usuarioActual;
}

