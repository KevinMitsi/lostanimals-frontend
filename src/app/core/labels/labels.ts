import { ReportStatusDto, SightingStatusDto, SpeciesDto } from '../models';

export const SPECIES_LABELS: Record<SpeciesDto, string> = {
  DOG: 'Perro',
  CAT: 'Gato',
  BIRD: 'Ave',
  OTHER: 'Otro',
};

export const REPORT_STATUS_LABELS: Record<ReportStatusDto, string> = {
  LOST: 'Perdido',
  REUNITED: 'Reencontrado',
  CLOSED: 'Cerrado',
};

export const SIGHTING_STATUS_LABELS: Record<SightingStatusDto, string> = {
  ACTIVE: 'Activo',
  CLOSED: 'Cerrado',
};
