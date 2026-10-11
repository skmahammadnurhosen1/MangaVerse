import * as argon2 from '@node-rs/argon2';

/**
 * Argon2id configuration matching project specification:
 * Memory: 19 MiB (19456 KiB)
 * Time / Iterations: 2
 * Parallelism: 1
 * Algorithm: Argon2id
 */
export const ARGON2ID_OPTIONS: argon2.Options = {
  algorithm: argon2.Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Pre-computed dummy Argon2id hash with identical parameters to prevent timing side channels
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$c29tZXJhbmRvbXNhbHQx$gV9aV2j1+i4aT6s1kE9ZJtH4G9/1qE5bJzK8f9g4z3s';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2ID_OPTIONS);
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Executes a dummy verification pass with the same work factor to eliminate
 * timing discrepancies when an account does not exist or is inactive.
 */
export async function dummyVerify(password: string): Promise<void> {
  try {
    await argon2.verify(DUMMY_HASH, password);
  } catch {
    // Ignore error
  }
}
