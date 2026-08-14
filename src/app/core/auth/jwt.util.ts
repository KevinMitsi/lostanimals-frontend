import { JwtClaims } from '../models';

/** Decodifica el payload de un JWT sin verificar la firma — solo para poblar UI/routing local. */
export function decodeJwtClaims(accessToken: string): JwtClaims | null {
  const parts = accessToken.split('.');
  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(payload) as JwtClaims;
  } catch {
    return null;
  }
}
