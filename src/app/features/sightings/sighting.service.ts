import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AttachImageRequest,
  AttachedImageResponse,
  CreateSightingRequest,
  CreateSightingResponse,
  EditSightingRequest,
  SightingPageResponse,
  SightingResponse,
  SightingSearchRequest,
} from '../../core/models';
import { toHttpParams } from '../../core/http/query-params.util';

/** Mapea 1:1 los endpoints de `/api/v1/sightings` (sección 3.3 del contrato). */
@Injectable({ providedIn: 'root' })
export class SightingService {
  private readonly http = inject(HttpClient);
  readonly basePath = `${environment.apiUrl}/sightings`;

  create(request: CreateSightingRequest): Observable<CreateSightingResponse> {
    return this.http.post<CreateSightingResponse>(this.basePath, request);
  }

  getById(sightingId: string): Observable<SightingResponse> {
    return this.http.get<SightingResponse>(`${this.basePath}/${sightingId}`);
  }

  search(filters: SightingSearchRequest): Observable<SightingPageResponse> {
    return this.http.get<SightingPageResponse>(this.basePath, { params: toHttpParams(filters) });
  }

  getMine(filters: SightingSearchRequest): Observable<SightingPageResponse> {
    return this.http.get<SightingPageResponse>(`${this.basePath}/mine`, { params: toHttpParams(filters) });
  }

  edit(sightingId: string, request: EditSightingRequest): Observable<void> {
    return this.http.put<void>(`${this.basePath}/${sightingId}`, request);
  }

  close(sightingId: string): Observable<void> {
    return this.http.patch<void>(`${this.basePath}/${sightingId}/close`, {});
  }

  attachImage(sightingId: string, request: AttachImageRequest): Observable<AttachedImageResponse> {
    return this.http.post<AttachedImageResponse>(`${this.basePath}/${sightingId}/images`, request);
  }

  deleteImage(sightingId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.basePath}/${sightingId}/images/${imageId}`);
  }

  setPrimaryImage(sightingId: string, imageId: string): Observable<void> {
    return this.http.put<void>(`${this.basePath}/${sightingId}/images/${imageId}/primary`, {});
  }
}
