import {
  ContactRequestStatusDto,
  ConversationReportStatusDto,
  ConversationStatusDto,
  PublicationTypeDto,
  ReportStatusDto,
  ReunionReviewStatusDto,
  SightingStatusDto,
  SpeciesDto,
  UserRoleDto,
} from '../models';

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

export const PUBLICATION_TYPE_LABELS: Record<PublicationTypeDto, string> = {
  LOST_PET_REPORT: 'Reporte de mascota perdida',
  SIGHTING: 'Avistamiento',
};

export const CONTACT_REQUEST_STATUS_LABELS: Record<ContactRequestStatusDto, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  REJECTED: 'Rechazada',
  CANCELED: 'Cancelada',
};

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatusDto, string> = {
  OPEN: 'Abierta',
  CLOSED: 'Cerrada',
};

export const USER_ROLE_LABELS: Record<UserRoleDto, string> = {
  USER: 'Usuario',
  MODERATOR: 'Moderador',
  ADMIN: 'Administrador',
};

export const REUNION_REVIEW_STATUS_LABELS: Record<ReunionReviewStatusDto, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
};

export const CONVERSATION_REPORT_STATUS_LABELS: Record<ConversationReportStatusDto, string> = {
  PENDING: 'Pendiente',
  RESOLVED: 'Resuelto',
  DISMISSED: 'Descartado',
};
