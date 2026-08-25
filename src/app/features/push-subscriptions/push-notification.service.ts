import { Injectable, inject, signal } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Messaging, deleteToken, getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { RUNTIME_CONFIG } from '../../core/config/runtime-config';
import { NotificationService } from '../../core/notifications/notification.service';
import { PushSubscriptionService } from './push-subscription.service';

const STORAGE_KEY = 'lostanimals.pushSubscriptionId';

export type PushPermissionState = 'unsupported' | 'default' | 'denied' | 'granted';

/**
 * Orquesta el permiso del navegador, el token de Firebase Cloud Messaging y su registro en
 * `/push-subscriptions` (ver `PushSubscriptionService`). El SDK de Firebase solo se inicializa
 * al primer uso real (no en cada carga de la app) para no pagar su costo si nadie activa
 * notificaciones.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly runtimeConfig = inject(RUNTIME_CONFIG);
  private readonly subscriptions = inject(PushSubscriptionService);
  private readonly notifications = inject(NotificationService);

  readonly state = signal<PushPermissionState>(this.initialState());
  readonly busy = signal(false);
  /** true si este navegador ya tiene un `subscriptionId` registrado (de esta sesión o una previa). */
  readonly subscribed = signal(!!localStorage.getItem(STORAGE_KEY));

  private app: FirebaseApp | null = null;
  private messaging: Messaging | null = null;

  /** false cuando faltan las variables de entorno de Firebase en este despliegue. */
  get configured(): boolean {
    return !!this.runtimeConfig.firebaseConfig.apiKey && !!this.runtimeConfig.firebaseVapidKey;
  }

  async enable(): Promise<void> {
    if (this.busy() || this.state() === 'unsupported' || !this.configured) {
      return;
    }
    this.busy.set(true);
    try {
      if (!(await isSupported())) {
        this.state.set('unsupported');
        return;
      }

      const permission = await Notification.requestPermission();
      this.state.set(permission);
      if (permission !== 'granted') {
        return;
      }

      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const messaging = this.messagingInstance();
      const token = await getToken(messaging, {
        vapidKey: this.runtimeConfig.firebaseVapidKey,
        serviceWorkerRegistration: registration,
      });

      this.subscriptions.register(token).subscribe({
        next: (response) => {
          localStorage.setItem(STORAGE_KEY, response.id);
          this.subscribed.set(true);
          this.notifications.success('Notificaciones push activadas.');
        },
        error: () => this.notifications.error('No se pudo registrar el dispositivo para notificaciones push.'),
      });

      this.listenForegroundMessages(messaging);
    } catch {
      this.notifications.error('No se pudo activar las notificaciones push en este navegador.');
    } finally {
      this.busy.set(false);
    }
  }

  disable(): void {
    const subscriptionId = localStorage.getItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    this.subscribed.set(false);
    if (this.messaging) {
      void deleteToken(this.messaging);
    }
    if (!subscriptionId) {
      return;
    }
    this.subscriptions.unregister(subscriptionId).subscribe({
      next: () => this.notifications.success('Notificaciones push desactivadas.'),
      error: () => this.notifications.error('No se pudo desactivar las notificaciones push.'),
    });
  }

  private initialState(): PushPermissionState {
    if (typeof Notification === 'undefined' || !('serviceWorker' in navigator)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  private messagingInstance(): Messaging {
    if (!this.messaging) {
      this.app = initializeApp(this.runtimeConfig.firebaseConfig);
      this.messaging = getMessaging(this.app);
    }
    return this.messaging;
  }

  private listenForegroundMessages(messaging: Messaging): void {
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title ?? 'LostAnimals';
      const body = payload.notification?.body;
      this.notifications.info(body ? `${title}: ${body}` : title);
    });
  }
}
