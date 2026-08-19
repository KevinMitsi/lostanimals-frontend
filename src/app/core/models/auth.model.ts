export type UserRoleDto = 'USER' | 'MODERATOR' | 'ADMIN';

export interface RegisterUserRequest {
  email: string;
  password: string;
  phone: string;
  documentNumber: string;
  displayName: string;
  acceptsDataProcessing: boolean;
  turnstileToken: string;
}

export interface RegisteredUserResponse {
  userId: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  turnstileToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export interface GoogleAuthenticationRequest {
  credential: string;
  acceptsDataProcessing: boolean;
}

export interface GoogleAuthenticationResponse extends TokenResponse {
  profileComplete: boolean;
  newUser: boolean;
}

export interface CompleteGoogleProfileRequest {
  phone: string;
  documentNumber: string;
}

export interface UserProfileResponse {
  userId: string;
  email: string;
  displayName: string;
  phone: string;
  documentNumber: string;
  pictureUrl: string | null;
  profileComplete: boolean;
}

export interface OpaqueTokenRequest {
  token: string;
}

export interface EmailActionRequest {
  email: string;
  turnstileToken: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

/** Claims decodificados del JWT (payload), solo para UI/routing — la autorización real la hace el backend. */
export interface JwtClaims {
  sub: string;
  email: string;
  scope: UserRoleDto;
  iat: number;
  exp: number;
  iss: string;
}
