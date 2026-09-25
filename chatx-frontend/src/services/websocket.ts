import { Client, StompSubscription } from '@stomp/stompjs';

class WebSocketService {
  private client: Client | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  public connect(token: string): Promise<void> {
    if (this.client && this.isConnected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Determine ws url based on current location / default backend port
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const brokerURL = `${protocol}//${window.location.hostname}:8080/ws`;

    this.connectionPromise = new Promise((resolve, reject) => {
      this.client = new Client({
        brokerURL,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
          token: token,
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: () => {
          // Debug callback
        },
        onConnect: () => {
          this.isConnected = true;
          this.connectionPromise = null;
          console.log('[WebSocket] Connected to STOMP broker');
          resolve();
        },
        onStompError: (frame) => {
          console.error('[WebSocket] Broker error: ' + frame.headers['message']);
          this.connectionPromise = null;
          reject(new Error(frame.headers['message']));
        },
        onWebSocketClose: () => {
          this.isConnected = false;
          this.connectionPromise = null;
        },
      });

      this.client.activate();
    });

    return this.connectionPromise;
  }

  public disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('[WebSocket] Disconnected from STOMP broker');
    }
  }

  public subscribe(destination: string, callback: (payload: any) => void): StompSubscription | null {
    if (!this.client || !this.isConnected) {
      console.warn('[WebSocket] Cannot subscribe, not connected to broker');
      return null;
    }

    return this.client.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (err) {
        console.error('[WebSocket] Error parsing message body:', err);
      }
    });
  }

  public subscribeToConversation(conversationId: string, callback: (event: any) => void): StompSubscription | null {
    return this.subscribe(`/topic/conversations/${conversationId}`, callback);
  }

  public subscribeToTyping(conversationId: string, callback: (event: any) => void): StompSubscription | null {
    return this.subscribe(`/topic/conversations/${conversationId}/typing`, callback);
  }

  public subscribeToPresence(callback: (event: any) => void): StompSubscription | null {
    return this.subscribe('/topic/presence', callback);
  }

  public sendTyping(conversationId: string, isTyping: boolean): void {
    if (!this.client || !this.isConnected) return;

    this.client.publish({
      destination: `/app/conversations/${conversationId}/typing`,
      body: JSON.stringify({ isTyping }),
    });
  }
}

export const wsService = new WebSocketService();
export default wsService;
