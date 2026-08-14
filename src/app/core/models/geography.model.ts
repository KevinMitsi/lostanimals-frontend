export interface DepartmentResponse {
  id: string;
  name: string;
}

export interface CityResponse {
  id: string;
  departmentId: string;
  name: string;
}

export interface NeighborhoodResponse {
  id: string;
  cityId: string;
  name: string;
}
