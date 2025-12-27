/**
 * Socket.io client utilities
 * Following Single Responsibility Principle
 */

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Get the WebSocket URL from environment variables
 */
export function getSocketUrl(): string {
  return process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
}

/**
 * Initialize socket connection (singleton pattern)
 */
export function initializeSocket(): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(getSocketUrl(), {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connected:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.io disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('🔴 Socket.io connection error:', error);
  });

  return socket;
}

/**
 * Get existing socket instance
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Disconnect socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Subscribe to all assets price updates
 */
export function subscribeToAllAssets(socket: Socket): void {
  socket.emit('subscribe_all_assets');
}

/**
 * Unsubscribe from all assets price updates
 */
export function unsubscribeFromAllAssets(socket: Socket): void {
  socket.emit('unsubscribe_all_assets');
}

/**
 * Subscribe to specific asset
 */
export function subscribeToAsset(socket: Socket, assetId: string): void {
  socket.emit('subscribe_asset', assetId);
}

/**
 * Unsubscribe from specific asset
 */
export function unsubscribeFromAsset(socket: Socket, assetId: string): void {
  socket.emit('unsubscribe_asset', assetId);
}