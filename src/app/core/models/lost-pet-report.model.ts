export type SpeciesDto = 'DOG' | 'CAT' | 'BIRD' | 'OTHER';
export type ReportStatusDto = 'LOST' | 'REUNITED' | 'CLOSED';
/** Único subconjunto que el dueño puede setear vía PATCH; REUNITED requiere revisión de moderador. */
export type OwnerReportStatusDto = 'LOST' | 'CLOSED';

export interface CreateLostPetReportRequest {
  petName: string;
  species: SpeciesDto;
  description: string;
  disappearedAt: string;
  latitude: number;
  longitude: number;
  departmentCode: string;
  municipalityCode: string;
  neighborhood: string;
  imageKeys: string[];
}

export interface CreateLostPetReportResponse {
  id: string;
}

export interface LostPetImageResponse {
  id: string;
  url: string;
  primary: boolean;
  sortOrder: number;
}

export interface LostPetReportResponse {
  id: string;
  petName: string;
  species: SpeciesDto;
  description: string;
  disappearedAt: string;
  latitude: number;
  longitude: number;
  departmentCode: string;
  municipalityCode: string;
  neighborhood: string;
  status: ReportStatusDto;
  images: LostPetImageResponse[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface LostPetReportPageResponse {
  items: LostPetReportResponse[];
  nextCursor: string | null;
}

export interface EditLostPetReportRequest {
  petName: string;
  species: SpeciesDto;
  description: string;
  disappearedAt: string;
  latitude: number;
  longitude: number;
  departmentCode: string;
  municipalityCode: string;
  neighborhood: string;
}

export interface CloseLostPetReportRequest {
  status: OwnerReportStatusDto;
}

export interface ReportSearchRequest {
  species?: SpeciesDto;
  departmentCode?: string;
  municipalityCode?: string;
  neighborhood?: string;
  status?: ReportStatusDto;
  from?: string;
  to?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  cursor?: string;
  limit?: number;
}

export interface ReunionReviewRequest {
  note: string;
}
