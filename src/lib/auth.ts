import crypto from 'crypto';

// The key used to sign the session token.
// Ideally this should be a random string in .env like SESSION_SECRET
// For a local dashboard, we'll derive it from the ADMIN_PASSWORD or a fallback.
function getSecretKey() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'fallback_local_secret_key_99';
}

/**
 * Creates a sha256 hash of the password.
 * In a real multi-user production app, we'd use bcrypt/argon2.
 * For a single-user local dashboard, sha256 with a salt is sufficient and avoids C++ binding issues.
 */
export function hashPassword(password: string): string {
  const salt = process.env.SESSION_SECRET || 'local_salt';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Verifies if the provided password matches the hashed password.
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * Generates a signed session token.
 * We use HMAC-SHA256 to sign a simple payload (e.g., "admin:{timestamp}")
 */
export function signSessionToken(): string {
  const payload = \`admin:\${Date.now()}\`;
  const signature = crypto
    .createHmac('sha256', getSecretKey())
    .update(payload)
    .digest('hex');
  
  return \`\${payload}.\${signature}\`;
}

/**
 * Verifies a signed session token.
 */
export function verifySessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [payload, signature] = parts;
  
  // Re-sign the payload and check if it matches the signature
  const expectedSignature = crypto
    .createHmac('sha256', getSecretKey())
    .update(payload)
    .digest('hex');
    
  // Time-constant comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (e) {
    return false; // If lengths differ, it throws
  }
}
