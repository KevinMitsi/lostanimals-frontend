import { HttpErrorResponse } from '@angular/common/http';
import { ProblemDetail } from '../models';

/** Error de aplicación ya traducido a partir de un ProblemDetail (RFC 7807) del backend. */
export interface AppApiError {
  status: number;
  detail: string;
  /** Solo presente en 400 de validación: cada item es "campo: mensaje". */
  errors?: string[];
  raw?: Partial<ProblemDetail>;
}

/**
 * Traduce un HttpErrorResponse al formato ProblemDetail del backend (sección 4 del contrato).
 * Si el body no trae `detail` (red caída, 5xx sin cuerpo, etc.) cae a un mensaje genérico
 * en vez de exponer detalles técnicos.
 */
export function parseProblemDetail(error: HttpErrorResponse): AppApiError {
  const body = error.error as Partial<ProblemDetail> | undefined;

  if (error.status === 0) {
    return {
      status: 0,
      detail: 'No se pudo conectar con el servidor. Verifica tu conexión.',
    };
  }

  if (!body?.detail) {
    return {
      status: error.status,
      detail: 'Algo salió mal, intenta de nuevo.',
      raw: body,
    };
  }

  return {
    status: error.status,
    detail: body.detail,
    errors: body.errors,
    raw: body,
  };
}

/** Parsea un item de `errors[]` con formato "campo: mensaje" en sus dos partes. */
export function splitFieldError(entry: string): { field: string; message: string } {
  const separatorIndex = entry.indexOf(':');
  if (separatorIndex === -1) {
    return { field: '', message: entry.trim() };
  }
  return {
    field: entry.slice(0, separatorIndex).trim(),
    message: entry.slice(separatorIndex + 1).trim(),
  };
}
