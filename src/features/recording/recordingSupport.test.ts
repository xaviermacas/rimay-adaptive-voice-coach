import { describe, expect, it, vi } from 'vitest';

import {
  createRecordingError,
  mapCaptureError,
  selectSupportedMimeType,
} from './recordingSupport';

describe('selectSupportedMimeType', () => {
  it('elige el primer formato compatible en el orden documentado', () => {
    const isTypeSupported = vi.fn(
      (mimeType: string) => mimeType === 'audio/webm',
    );

    expect(selectSupportedMimeType({ isTypeSupported })).toBe('audio/webm');
    expect(isTypeSupported).toHaveBeenNthCalledWith(1, 'audio/webm;codecs=opus');
    expect(isTypeSupported).toHaveBeenNthCalledWith(2, 'audio/webm');
  });

  it('permite usar el formato predeterminado cuando ningún candidato coincide', () => {
    expect(
      selectSupportedMimeType({ isTypeSupported: () => false }),
    ).toBeNull();
  });
});

describe('mapCaptureError', () => {
  it('distingue permiso denegado y micrófono ausente', () => {
    expect(mapCaptureError(new DOMException('', 'NotAllowedError'))).toEqual(
      createRecordingError('permission_denied'),
    );
    expect(mapCaptureError(new DOMException('', 'TimeoutError'))).toEqual(
      createRecordingError('microphone_request_timeout'),
    );
    expect(mapCaptureError(new DOMException('', 'NotFoundError'))).toEqual(
      createRecordingError('microphone_not_found'),
    );
    expect(mapCaptureError(new DOMException('', 'NotSupportedError'))).toEqual(
      createRecordingError('browser_unsupported'),
    );
  });
});
