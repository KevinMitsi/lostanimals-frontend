export type ReunionReviewStatusDto = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ConversationReportStatusDto = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface ReunionReviewResponse {
  id: string;
  reportId: string;
  ownerId: string;
  ownerName: string;
  /** Solo visible para moderador/admin. */
  ownerPhone: string;
  requestNote: string;
  status: ReunionReviewStatusDto;
  createdAt: string;
}

export interface ModerationDecisionRequest {
  approved: boolean;
  note: string;
}

export interface ConversationReportResponse {
  id: string;
  conversationId: string;
  reporterId: string;
  reason: string;
  details: string;
  status: ConversationReportStatusDto;
  createdAt: string;
}

export interface ReportDecisionRequest {
  resolved: boolean;
}
