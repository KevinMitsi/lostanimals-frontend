export interface IdResponse {
  id: string;
}

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: string[];
}

export interface PrepareImageUploadRequest {
  fileName: string;
  contentType: 'image/jpeg' | 'image/png';
  contentLength: number;
  checksumSha256: string;
}

export interface PreparedImageUploadResponse {
  objectKey: string;
  uploadUrl: string;
  method: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
}

export interface AttachImageRequest {
  objectKey: string;
}

export interface AttachedImageResponse {
  imageId: string;
}
