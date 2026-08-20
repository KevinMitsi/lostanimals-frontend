import { distanceMeters } from './nearby-sightings-map';

describe('distanceMeters', () => {
  it('returns zero for the same position', () => {
    expect(distanceMeters({ latitude: 4.711, longitude: -74.0721 }, { latitude: 4.711, longitude: -74.0721 })).toBe(0);
  });

  it('calculates movement accurately enough for the 500 meter refresh threshold', () => {
    const distance = distanceMeters(
      { latitude: 4.711, longitude: -74.0721 },
      { latitude: 4.716, longitude: -74.0721 },
    );
    expect(distance).toBeGreaterThan(500);
    expect(distance).toBeLessThan(600);
  });
});
