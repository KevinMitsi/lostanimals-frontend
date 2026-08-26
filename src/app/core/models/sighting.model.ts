import { SpeciesDto } from './lost-pet-report.model';

export type SightingStatusDto = 'ACTIVE' | 'CLOSED';

export interface CreateSightingRequest {
  species: SpeciesDto;
  description: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  departmentCode: string;
  municipalityCode: string;
  neighborhood: string;
  imageKeys: string[];
  /** false en el primer intento; true al reenviar tras confirmar el warning de duplicado. */
  confirmPossibleDuplicate: boolean;
}

export interface DuplicateSightingWarningResponse {
  existingSightingId: string;
  distanceMeters: number;
  observedAt: string;
}

export interface CreateSightingResponse {
  id: string;
  created: boolean;
  warning: DuplicateSightingWarningResponse | null;
}

export interface SightingImageResponse {
  id: string;
  url: string;
  primary: boolean;
  sortOrder: number;
}

export interface SightingResponse {
  id: string;
  species: SpeciesDto;
  description: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  departmentCode: string;
  municipalityCode: string;
  neighborhood: string;
  status: SightingStatusDto;
  images: SightingImageResponse[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SightingPageResponse {
  items: SightingResponse[];
  nextCursor: string | null;
}

export interface EditSightingRequest {
  species: SpeciesDto;
  description: string;
  observedAt: string;
  latitude: number;
  longitude: number;
  departmentCode: string;
  municipalityCode: string;
  neighborhood: string;
}

export interface SightingSearchRequest {
  species?: SpeciesDto;
  departmentCode?: string;
  municipalityCode?: string;
  neighborhood?: string;
  status?: SightingStatusDto;
  from?: string;
  to?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  cursor?: string;
  limit?: number;
}
