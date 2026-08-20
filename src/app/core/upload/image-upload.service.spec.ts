import { browserUploadHeaders } from './image-upload.service';

describe('browserUploadHeaders', () => {
  it('removes browser-managed headers and preserves signed S3 headers', () => {
    expect(
      browserUploadHeaders({
        host: 'bucket.s3.amazonaws.com',
        'Content-Length': '1024',
        'Content-Type': 'image/png',
        'x-amz-checksum-sha256': 'checksum',
      }),
    ).toEqual({
      'Content-Type': 'image/png',
      'x-amz-checksum-sha256': 'checksum',
    });
  });
});
