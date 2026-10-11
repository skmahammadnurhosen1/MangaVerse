import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, dummyVerify, ARGON2ID_OPTIONS } from '../src/services/argonService.js';

describe('Argon2id Password Security Service', () => {
  it('should use the exact RFC standard parameters (19 MiB memory, 2 iterations, 1 parallelism)', () => {
    expect(ARGON2ID_OPTIONS.memoryCost).toBe(19456);
    expect(ARGON2ID_OPTIONS.timeCost).toBe(2);
    expect(ARGON2ID_OPTIONS.parallelism).toBe(1);
  });

  it('should generate an Argon2id formatted encoded hash with embedded salt and parameters', async () => {
    const password = 'SuperSecurePassword2026!';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
  });

  it('should correctly verify valid passwords and reject invalid passwords', async () => {
    const password = 'CorrectHorseBatteryStaple';
    const hash = await hashPassword(password);

    const validResult = await verifyPassword(hash, password);
    expect(validResult).toBe(true);

    const invalidResult = await verifyPassword(hash, 'WrongPassword');
    expect(invalidResult).toBe(false);
  });

  it('should safely execute dummyVerify without throwing exceptions', async () => {
    await expect(dummyVerify('AnyPasswordToTest')).resolves.not.toThrow();
  });
});
