import { geolocationErrorMessage } from './geolocation.service';

describe('geolocationErrorMessage', () => {
  it('explains a denied permission without leaking technical details', () => {
    expect(geolocationErrorMessage(1)).toContain('permiso');
  });

  it('provides a safe fallback for unknown browser errors', () => {
    expect(geolocationErrorMessage(999)).toBe('No fue posible acceder a tu ubicación.');
  });
});
