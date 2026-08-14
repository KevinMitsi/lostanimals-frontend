import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CityResponse, DepartmentResponse, NeighborhoodResponse } from '../../core/models';

/** Mapea 1:1 los endpoints de `/api/v1/geography` (sección 3.4 del contrato). Todo público. */
@Injectable({ providedIn: 'root' })
export class GeographicCatalogService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/geography`;

  getDepartments(): Observable<DepartmentResponse[]> {
    return this.http.get<DepartmentResponse[]>(`${this.base}/departments`);
  }

  getCities(departmentId: string): Observable<CityResponse[]> {
    return this.http.get<CityResponse[]>(`${this.base}/cities`, { params: { departmentId } });
  }

  getNeighborhoods(cityId: string): Observable<NeighborhoodResponse[]> {
    return this.http.get<NeighborhoodResponse[]>(`${this.base}/neighborhoods`, { params: { cityId } });
  }
}
