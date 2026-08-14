import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConversationReportResponse,
  ModerationDecisionRequest,
  ReportDecisionRequest,
  ReunionReviewResponse,
} from '../../core/models';

/** Mapea 1:1 los endpoints de `/api/v1/moderator` (secciones 3.7/3.8 del contrato). Rol MODERATOR/ADMIN. */
@Injectable({ providedIn: 'root' })
export class ModeratorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/moderator`;

  getReunionReviews(): Observable<ReunionReviewResponse[]> {
    return this.http.get<ReunionReviewResponse[]>(`${this.base}/reunion-reviews`);
  }

  decideReunionReview(reviewId: string, request: ModerationDecisionRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/reunion-reviews/${reviewId}`, request);
  }

  getConversationReports(): Observable<ConversationReportResponse[]> {
    return this.http.get<ConversationReportResponse[]>(`${this.base}/conversation-reports`);
  }

  decideConversationReport(reportId: string, request: ReportDecisionRequest): Observable<void> {
    return this.http.patch<void>(`${this.base}/conversation-reports/${reportId}`, request);
  }
}
