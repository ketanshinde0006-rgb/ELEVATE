import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import crypto from 'crypto';

/**
 * Generate standard RFC4122 v4 UUID
 */
export function generateUuid() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return uuidv4();
}

/**
 * Check if a string is a valid UUID
 */
export function isValidUuid(str) {
  if (!str || typeof str !== 'string') return false;
  return validateUuid(str);
}

export { uuidv4, validateUuid };
export default generateUuid;
