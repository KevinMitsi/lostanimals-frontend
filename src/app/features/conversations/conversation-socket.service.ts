import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionStore } from '../../core/auth/session.store';
import { MessageResponse } from '../../core/models';

/** Códigos documentados en `WEBSOCKET_MENSAJERIA.md` del backend. */
export interface ConversationSocketErrorFrame {
  readonly code:
    | 'INVALID_PAYLOAD'
    | 'PAYLOAD_TOO_LARGE'
    | 'VALIDATION_ERROR'
    | 'BUSINESS_RULE_VIOLATION'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'INTERNAL_ERROR';
  readonly message: string;
}

const RECONNECT_DELAY_MS = 3000;

function websocketBaseUrl(): string {
  return environment.apiUrl.replace(/^http/, 'ws').replace(/\/api\/v1\/?$/, '');
}

/**
 * Cliente del WebSocket de mensajería (`/ws/conversations/{id}?access_token=`).
 * El envío por HTTP fue retirado del backend; ahora se envía y recibe por este socket,
 * conservando la carga histórica por HTTP para el arranque y la reconexión.
 */
@Injectable({ providedIn: 'root' })
export class ConversationSocketService {
  private readonly session = inject(SessionStore);

  private socket: WebSocket | null = null;
  private conversationId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private manuallyClosed = true;

  private readonly messageSubject = new Subject<MessageResponse>();
  private readonly errorSubject = new Subject<ConversationSocketErrorFrame>();
  private readonly reconnectedSubject = new Subject<void>();
  private readonly connectionSubject = new Subject<boolean>();

  readonly messages$: Observable<MessageResponse> = this.messageSubject.asObservable();
  readonly errors$: Observable<ConversationSocketErrorFrame> = this.errorSubject.asObservable();
  /** Emite cuando el socket vuelve a abrir tras una caída (no en la conexión inicial). */
  readonly reconnected$: Observable<void> = this.reconnectedSubject.asObservable();
  /** Estado real del socket (abierto/cerrado), para reflejar en la UI si se puede enviar. */
  readonly connectionState$: Observable<boolean> = this.connectionSubject.asObservable();

  connect(conversationId: string): void {
    this.disconnect();
    this.conversationId = conversationId;
    this.manuallyClosed = false;
    this.open(false);
  }

  /** Encola el mensaje en el socket. Devuelve `false` si el socket todavía no está listo. */
  send(content: string): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return false;
    }
    this.socket.send(JSON.stringify({ content }));
    return true;
  }

  disconnect(): void {
    this.manuallyClosed = true;
    this.conversationId = null;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.connectionSubject.next(false);
  }

  private open(isReconnect: boolean): void {
    const conversationId = this.conversationId;
    const token = this.session.accessToken();
    if (!conversationId || !token) {
      return;
    }

    const url = new URL(`${websocketBaseUrl()}/ws/conversations/${conversationId}`);
    url.searchParams.set('access_token', token);

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.connectionSubject.next(true);
      if (isReconnect) {
        this.reconnectedSubject.next();
      }
    };

    socket.onmessage = ({ data }) => {
      let frame: MessageResponse | ConversationSocketErrorFrame;
      try {
        frame = JSON.parse(data as string);
      } catch {
        return;
      }
      if ('code' in frame) {
        this.errorSubject.next(frame);
      } else {
        this.messageSubject.next(frame);
      }
    };

    socket.onclose = () => {
      if (this.socket !== socket || this.manuallyClosed) {
        return;
      }
      this.socket = null;
      this.connectionSubject.next(false);
      this.reconnectTimer = setTimeout(() => this.open(true), RECONNECT_DELAY_MS);
    };
  }
}
