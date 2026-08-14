import { UserRoleDto } from './auth.model';

export interface ServiceAreaResponse {
  cityId: string;
  cityName: string;
  departmentId: string;
  departmentName: string;
  enabled: boolean;
}

export interface SetServiceAreaRequest {
  enabled: boolean;
}

export interface ChangeRoleRequest {
  role: UserRoleDto;
}
