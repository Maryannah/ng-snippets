import { TestBed } from '@angular/core/testing';

import { OverlaysService } from './overlays.utils';

describe('OverlaysService', () => {
  let service: OverlaysService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OverlaysService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
