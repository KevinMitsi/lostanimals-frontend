export type ConversationStatusDto = 'OPEN' | 'CLOSED';

export interface ParticipantResponse {
  userId: string;
  displayName: string;
}

export interface ConversationResponse {
  id: string;
  status: ConversationStatusDto;
  /** Exactamente 2 participantes. */
  participants: ParticipantResponse[];
  createdAt: string;
  closedAt: string | null;
}

export interface MessageResponse {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface MessagePageResponse {
  items: MessageResponse[];
  nextAfter: string | null;
}

export interface SendMessageRequest {
  content: string;
}

export interface ReportConversationRequest {
  reason: string;
  details: string;
}
