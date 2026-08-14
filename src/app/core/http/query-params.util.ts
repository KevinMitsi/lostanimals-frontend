import { HttpParams } from '@angular/common/http';

/** Convierte un objeto de filtros a HttpParams, omitiendo valores undefined/null. */
export function toHttpParams(source: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
