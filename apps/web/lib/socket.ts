import { io, type Socket } from 'socket.io-client';
import { API_URL, api, tokens } from './api';

// One shared Socket.io connection for the whole app. The token is read on every (re)connect,
// so a refreshed access token is picked up automatically.
let socket: Socket | null = null;
let authRetries = 0;

export function getSocket(): Socket | null {
  if (typeof window === 'undefined' || !tokens.access) return null;
  if (!socket) {
    socket = io(API_URL, {
      auth: (cb) => cb({ token: tokens.access ?? '' }),
      transports: ['websocket', 'polling'],
    });
    socket.on('connect', () => {
      authRetries = 0;
    });
    socket.on('connect_error', (err) => {
      // The server rejects expired tokens. Any authenticated API call refreshes the token, then we reconnect.
      if (err.message !== 'UNAUTHENTICATED' || authRetries >= 3) return;
      authRetries += 1;
      api('/auth/me')
        .then(() => socket?.connect())
        .catch(() => undefined);
    });
  }
  return socket;
}

export function emitSocket(event: string, ...args: unknown[]) {
  getSocket()?.emit(event, ...args);
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  authRetries = 0;
}
