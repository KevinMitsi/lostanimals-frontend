import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IdResponse, RegisterPushSubscriptionRequest } from '../../core/models';

/**
 * Mapea 1:1 los endpoints de `/api/v1/push-subscriptions` (sección 3.10 del contrato).
 * El servicio queda listo para cuando se integre un proveedor de push real (FCM u otro);
 * hoy no hay infraestructura de push configurada en el proyecto, así que la UI que lo
 * consume (ver ProfilePage) se deja como placeholder deshabilitado — ver nota de la sección 3.10.
 */
@Injectable({ providedIn: 'root' })
export class PushSubscriptionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/push-subscriptions`;

  register(deviceToken: string): Observable<IdResponse> {
    const request: RegisterPushSubscriptionRequest = { deviceToken };
    return this.http.post<IdResponse>(this.base, request);
  }

  unregister(subscriptionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${subscriptionId}`);
  }
}
