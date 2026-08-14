import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttachImageRequest,
  AttachedImageResponse,
  CloseLostPetReportRequest,
  CreateLostPetReportRequest,
  CreateLostPetReportResponse,
  EditLostPetReportRequest,
  IdResponse,
  LostPetReportPageResponse,
  LostPetReportResponse,
  ReportSearchRequest,
  ReunionReviewRequest,
} from '../../core/models';
import { toHttpParams } from '../../core/http/query-params.util';

/** Mapea 1:1 los endpoints de `/api/v1/lost-pet-reports` (sección 3.2 del contrato). */
@Injectable({ providedIn: 'root' })
export class LostPetReportService {
  private readonly http = inject(HttpClient);
  readonly basePath = `${environment.apiUrl}/lost-pet-reports`;

  create(request: CreateLostPetReportRequest): Observable<CreateLostPetReportResponse> {
    return this.http.post<CreateLostPetReportResponse>(this.basePath, request);
  }

  getById(reportId: string): Observable<LostPetReportResponse> {
    return this.http.get<LostPetReportResponse>(`${this.basePath}/${reportId}`);
  }

  /** Público: coordenadas aproximadas por privacidad. */
  search(filters: ReportSearchRequest): Observable<LostPetReportPageResponse> {
    return this.http.get<LostPetReportPageResponse>(this.basePath, { params: toHttpParams(filters) });
  }

  /** Del propio usuario: coordenadas exactas. */
  getMine(filters: ReportSearchRequest): Observable<LostPetReportPageResponse> {
    return this.http.get<LostPetReportPageResponse>(`${this.basePath}/mine`, { params: toHttpParams(filters) });
  }

  edit(reportId: string, request: EditLostPetReportRequest): Observable<void> {
    return this.http.put<void>(`${this.basePath}/${reportId}`, request);
  }

  updateStatus(reportId: string, request: CloseLostPetReportRequest): Observable<void> {
    return this.http.patch<void>(`${this.basePath}/${reportId}/status`, request);
  }

  attachImage(reportId: string, request: AttachImageRequest): Observable<AttachedImageResponse> {
    return this.http.post<AttachedImageResponse>(`${this.basePath}/${reportId}/images`, request);
  }

  deleteImage(reportId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/${reportId}/images/${imageId}`);
  }

  setPrimaryImage(reportId: string, imageId: string): Observable<void> {
    return this.http.put<void>(`${this.basePath}/${reportId}/images/${imageId}/primary`, {});
  }

  requestReunionReview(reportId: string, request: ReunionReviewRequest): Observable<IdResponse> {
    return this.http.post<IdResponse>(`${this.basePath}/${reportId}/reunion-review`, request);
  }
}
