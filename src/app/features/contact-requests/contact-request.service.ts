import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactRequestResponse, CreateContactRequest, IdResponse } from '../../core/models';

/** Mapea 1:1 los endpoints de `/api/v1/contact-requests` (sección 3.5 del contrato). Todo autenticado. */
@Injectable({ providedIn: 'root' })
export class ContactRequestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/contact-requests`;

  create(request: CreateContactRequest): Observable<IdResponse> {
    return this.http.post<IdResponse>(this.base, request);
  }

  getReceived(): Observable<ContactRequestResponse[]> {
    return this.http.get<ContactRequestResponse[]>(`${this.base}/received`);
  }

  getSent(): Observable<ContactRequestResponse[]> {
    return this.http.get<ContactRequestResponse[]>(`${this.base}/sent`);
  }

  accept(requestId: string): Observable<IdResponse> {
    return this.http.patch<IdResponse>(`${this.base}/${requestId}/accept`, {});
  }

  reject(requestId: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${requestId}/reject`, {});
  }

  cancel(requestId: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${requestId}/cancel`, {});
  }
}
