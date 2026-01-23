import { readFileSync } from 'fs';
import { join } from 'path';

export function loadFixture<T>(path: string): T {
  const fullPath = join(__dirname, '../fixtures', path);
  const data = readFileSync(fullPath, 'utf-8');
  return JSON.parse(data);
}

export function createMockConfig(overrides = {}) {
  return {
    appId: 'test_app_id',
    mchId: 'test_mch_id',
    apiKey: 'test_api_key_32_bytes_long1234',
    publicKey: Buffer.alloc(2048),
    privateKey: Buffer.alloc(2048),
    ...overrides
  };
}
