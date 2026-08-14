import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ChangeRoleRequest,
  ModerationDecisionRequest,
  ReunionReviewResponse,
  ServiceAreaResponse,
  SetServiceAreaRequest,
  UserRoleDto,
} from '../../core/models';

/** Mapea 1:1 los endpoints de `/api/v1/admin` (sección 3.9 del contrato). Rol ADMIN. */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin`;

  getServiceAreas(): Observable<ServiceAreaResponse[]> {
    return this.http.get<ServiceAreaResponse[]>(`${this.base}/service-areas`);
  }

  setServiceArea(cityId: string, enabled: boolean): Observable<void> {
    const request: SetServiceAreaRequest = { enabled };
    return this.http.put<void>(`${this.base}/service-areas/${cityId}`, request);
  }

  changeUserRole(userId: string, role: UserRoleDto): Observable<void> {
    const request: ChangeRoleRequest = { role };
    return this.http.put<void>(`${this.base}/users/${userId}/role`, request);
  }

  /** Igual que en moderador, pero bajo `/admin` (sección 3.9). */
  getReunionReviews(): Observable<ReunionReviewResponse[]> {
    return this.http.get<ReunionReviewResponse[]>(`${this.base}/reunion-reviews`);
  }

  decideReunionReview(reviewId: string, request: ModerationDecisionRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/reunion-reviews/${reviewId}`, request);
  }
}
