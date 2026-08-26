import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { RUNTIME_CONFIG } from '../../core/config/runtime-config';
import { DepartmentResponse, MunicipalityResponse } from '../../core/models';

interface DivipolaRow {
  cod_dpto: string;
  dpto?: string;
  cod_mpio?: string;
  nom_mpio?: string;
}

interface SodaQueryRequest {
  query: string;
  page: { pageNumber: number; pageSize: number };
  includeSynthetic: boolean;
}

/** Catálogo DIVIPOLA oficial publicado por Datos Abiertos Colombia (dataset gdxc-w37w). */
@Injectable({ providedIn: 'root' })
export class GeographicCatalogService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RUNTIME_CONFIG);
  private readonly endpoint = 'https://www.datos.gov.co/api/v3/views/gdxc-w37w/query.json';
  private readonly municipalitiesByDepartment = new Map<string, Observable<MunicipalityResponse[]>>();

  private readonly departments = this.query(
    'SELECT DISTINCT `cod_dpto`, `dpto` ORDER BY `dpto`',
    100,
  ).pipe(
    map((rows) => rows.map((row) => ({ code: row.cod_dpto, name: row.dpto ?? row.cod_dpto }))),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  getDepartments(): Observable<DepartmentResponse[]> {
    return this.departments;
  }

  getMunicipalities(departmentCode: string): Observable<MunicipalityResponse[]> {
    if (!/^\d{2}$/.test(departmentCode)) {
      throw new Error('El código de departamento DIVIPOLA debe tener dos dígitos.');
    }

    const cached = this.municipalitiesByDepartment.get(departmentCode);
    if (cached) return cached;

    const municipalities = this.query(
      `SELECT \`cod_dpto\`, \`cod_mpio\`, \`nom_mpio\` WHERE \`cod_dpto\` = '${departmentCode}' ORDER BY \`nom_mpio\``,
      2000,
    ).pipe(
      map((rows) =>
        rows
          .filter((row) => row.cod_mpio && row.nom_mpio)
          .map((row) => ({
            code: row.cod_mpio!,
            departmentCode: row.cod_dpto,
            name: row.nom_mpio!,
          })),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.municipalitiesByDepartment.set(departmentCode, municipalities);
    return municipalities;
  }

  private query(query: string, pageSize: number): Observable<DivipolaRow[]> {
    const body: SodaQueryRequest = {
      query,
      page: { pageNumber: 1, pageSize },
      includeSynthetic: false,
    };
    const headers = this.runtimeConfig.socrataAppToken
      ? new HttpHeaders({ 'X-App-Token': this.runtimeConfig.socrataAppToken })
      : undefined;
    return this.http.post<DivipolaRow[]>(this.endpoint, body, { headers });
  }
}
