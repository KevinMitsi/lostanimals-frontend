import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RUNTIME_CONFIG, RuntimeConfig } from '../../core/config/runtime-config';
import { GeographicCatalogService } from './geographic-catalog.service';

describe('GeographicCatalogService', () => {
  let service: GeographicCatalogService;
  let http: HttpTestingController;

  const runtimeConfig: RuntimeConfig = {
    mapboxPublicToken: '',
    socrataAppToken: 'public-app-token',
    firebaseConfig: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
    },
    firebaseVapidKey: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RUNTIME_CONFIG, useValue: runtimeConfig },
      ],
    });
    service = TestBed.inject(GeographicCatalogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads departments from the official SODA3 dataset', () => {
    let result: unknown;
    service.getDepartments().subscribe((departments) => (result = departments));

    const request = http.expectOne(
      'https://www.datos.gov.co/api/v3/views/gdxc-w37w/query.json',
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-App-Token')).toBe('public-app-token');
    expect(request.request.body.query).toContain('DISTINCT');
    request.flush([
      { cod_dpto: '63', dpto: 'Quindío' },
      { cod_dpto: '05', dpto: 'Antioquia' },
    ]);

    expect(result).toEqual([
      { code: '63', name: 'Quindío' },
      { code: '05', name: 'Antioquia' },
    ]);
  });

  it('loads and caches municipalities for a selected department', () => {
    let firstResult: unknown;
    service.getMunicipalities('63').subscribe((municipalities) => (firstResult = municipalities));

    const request = http.expectOne(
      'https://www.datos.gov.co/api/v3/views/gdxc-w37w/query.json',
    );
    expect(request.request.body.query).toContain("`cod_dpto` = '63'");
    request.flush([{ cod_dpto: '63', cod_mpio: '63001', nom_mpio: 'Armenia' }]);

    let cachedResult: unknown;
    service.getMunicipalities('63').subscribe((municipalities) => (cachedResult = municipalities));
    http.expectNone('https://www.datos.gov.co/api/v3/views/gdxc-w37w/query.json');
    expect(firstResult).toEqual([
      { code: '63001', departmentCode: '63', name: 'Armenia' },
    ]);
    expect(cachedResult).toEqual(firstResult);
  });

  it('rejects a department code that cannot be safely interpolated into SoQL', () => {
    expect(() => service.getMunicipalities("63' OR '1'='1")).toThrowError(
      'El código de departamento DIVIPOLA debe tener dos dígitos.',
    );
  });
});
