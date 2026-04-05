import { API_BASE } from './api';

const WS_URL =
  process.env.REACT_APP_WS_URL || `${API_BASE.replace(/^http/i, 'ws')}/ws`;

function connectToEventStream({ onOpen, onClose, onError, onMessage }) {
  const socket = new WebSocket(WS_URL);

  socket.addEventListener('open', () => onOpen?.());
  socket.addEventListener('close', () => onClose?.());
  socket.addEventListener('error', () => onError?.());
  socket.addEventListener('message', (event) => {
    try {
      onMessage?.(JSON.parse(event.data));
    } catch {
      return;
    }
  });

  return () => socket.close();
}

export { connectToEventStream, WS_URL };
