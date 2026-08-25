import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationResponse, IdResponse, MessagePageResponse, ReportConversationRequest } from '../../core/models';

/** Mapea 1:1 los endpoints de `/api/v1/conversations` (sección 3.6 del contrato). Todo autenticado. */
@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/conversations`;

  getAll(): Observable<ConversationResponse[]> {
    return this.http.get<ConversationResponse[]>(this.base);
  }

  getMessages(conversationId: string, after?: string, limit = 50): Observable<MessagePageResponse> {
    let params = new HttpParams().set('limit', limit);
    if (after) {
      params = params.set('after', after);
    }
    return this.http.get<MessagePageResponse>(`${this.base}/${conversationId}/messages`, { params });
  }

  close(conversationId: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${conversationId}/close`, {});
  }

  block(conversationId: string): Observable<void> {
    return this.http.patch<void>(`${this.base}/${conversationId}/block`, {});
  }

  report(conversationId: string, request: ReportConversationRequest): Observable<IdResponse> {
    return this.http.post<IdResponse>(`${this.base}/${conversationId}/reports`, request);
  }
}
