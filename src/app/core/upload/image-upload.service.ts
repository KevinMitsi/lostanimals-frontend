import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from, map, switchMap, throwError } from 'rxjs';
import { PrepareImageUploadRequest, PreparedImageUploadResponse } from '../models';
import { sha256Base64 } from './checksum.util';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES: PrepareImageUploadRequest['contentType'][] = ['image/jpeg', 'image/png'];
const BROWSER_MANAGED_HEADERS = new Set(['content-length', 'host']);

export function browserUploadHeaders(requiredHeaders: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(requiredHeaders).filter(
      ([name]) => !BROWSER_MANAGED_HEADERS.has(name.toLowerCase()),
    ),
  );
}

export interface UploadedImage {
  objectKey: string;
  previewUrl: string;
}

/**
 * Sube imágenes directo a S3 en dos pasos (sección 2.1 del contrato), reutilizable entre
 * reportes y avistamientos. `resourceBasePath` es la URL base del dominio dueño del recurso
 * (ej. `${environment.apiUrl}/lost-pet-reports`), porque `/image-uploads` cuelga de cada uno.
 */
@Injectable({ providedIn: 'root' })
export class ImageUploadService {
  private readonly http = inject(HttpClient);

  /** Valida el archivo contra las reglas del contrato antes de gastar una petición. */
  validateFile(file: File): string | null {
    if (!ALLOWED_CONTENT_TYPES.includes(file.type as PrepareImageUploadRequest['contentType'])) {
      return 'Solo se aceptan imágenes JPG o PNG.';
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return 'La imagen supera el tamaño máximo de 8MB.';
    }
    if (file.name.length > 255) {
      return 'El nombre del archivo es demasiado largo.';
    }
    return null;
  }

  uploadImage(resourceBasePath: string, file: File): Observable<UploadedImage> {
    const validationError = this.validateFile(file);
    if (validationError) {
      return throwError(() => new Error(validationError));
    }

    return from(sha256Base64(file)).pipe(
      switchMap((checksumSha256) => {
        const request: PrepareImageUploadRequest = {
          fileName: file.name,
          contentType: file.type as PrepareImageUploadRequest['contentType'],
          contentLength: file.size,
          checksumSha256,
        };
        return this.http.post<PreparedImageUploadResponse>(`${resourceBasePath}/image-uploads`, request);
      }),
      switchMap((prepared) =>
        this.http
          .put(prepared.uploadUrl, file, { headers: browserUploadHeaders(prepared.requiredHeaders) })
          .pipe(map(() => ({ objectKey: prepared.objectKey, previewUrl: URL.createObjectURL(file) }))),
      ),
    );
  }
}
