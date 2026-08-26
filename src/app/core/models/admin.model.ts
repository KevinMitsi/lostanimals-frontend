import { UserRoleDto } from './auth.model';

export interface ServiceAreaResponse {
  municipalityCode: string;
  enabled: boolean;
}

export interface SetServiceAreaRequest {
  enabled: boolean;
}

export interface ChangeRoleRequest {
  role: UserRoleDto;
}
