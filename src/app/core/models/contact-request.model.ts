export type PublicationTypeDto = 'LOST_PET_REPORT' | 'SIGHTING';
export type ContactRequestStatusDto = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED';

export interface CreateContactRequest {
  publicationType: PublicationTypeDto;
  publicationId: string;
  note: string;
}

export interface ContactRequestResponse {
  id: string;
  publicationType: PublicationTypeDto;
  publicationId: string;
  requesterId: string;
  recipientId: string;
  status: ContactRequestStatusDto;
  note: string;
  createdAt: string;
  answeredAt: string | null;
}
