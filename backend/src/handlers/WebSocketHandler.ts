import { Server, Socket } from 'socket.io';

class WebSocketHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  initialize() {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe_asset', (assetId: string) => {
        socket.join(`asset:${assetId}`);
        console.log(`Client ${socket.id} subscribed to asset ${assetId}`);
      });

      socket.on('unsubscribe_asset', (assetId: string) => {
        socket.leave(`asset:${assetId}`);
        console.log(`Client ${socket.id} unsubscribed from asset ${assetId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  emitToAsset(assetId: string, event: string, data: any) {
    this.io.to(`asset:${assetId}`).emit(event, data);
  }
}

export default WebSocketHandler;