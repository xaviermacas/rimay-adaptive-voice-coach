import { describe, expect, it, vi } from 'vitest';

import {
  createRecordingError,
  mapCaptureError,
  selectSupportedMimeType,
} from './recordingSupport';

describe('selectSupportedMimeType', () => {
  it('prioriza MP4 con AAC cuando el navegador objetivo lo admite', () => {
    const isTypeSupported = vi.fn(() => true);

    expect(selectSupportedMimeType({ isTypeSupported })).toBe(
      'audio/mp4;codecs=mp4a.40.2',
    );
    expect(isTypeSupported).toHaveBeenCalledOnce();
    expect(isTypeSupported).toHaveBeenCalledWith(
      'audio/mp4;codecs=mp4a.40.2',
    );
  });

  it('conserva WebM como fallback cuando MP4 no está disponible', () => {
    const isTypeSupported = vi.fn(
      (mimeType: string) => mimeType === 'audio/webm',
    );

    expect(selectSupportedMimeType({ isTypeSupported })).toBe('audio/webm');
    expect(isTypeSupported.mock.calls.map(([mimeType]) => mimeType)).toEqual([
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4;codecs=opus',
      'audio/mp4',
      'audio/webm;codecs=opus',
      'audio/webm',
    ]);
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
