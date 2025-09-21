import { v4 as uuidv4 } from 'uuid';

/**
 * Generates a version 4 UUID.
 * @returns A UUID string.
 */
export function generateUUID(): string {
  return uuidv4();
}