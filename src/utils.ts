import { toNumber } from '@whiskeysockets/baileys';
import Long from 'long';
import type { MakeSerializedPrisma, MakeTransformedPrisma } from './types';

/** Helper to fix complex types for Prisma compatibility */
export function fixComplexType(value: any): number | null | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'object') {
    // Try to convert object to number
    const num = toNumber(value);
    return isNaN(num) ? undefined : num;
  }

  if (typeof value === 'bigint') {
    // Convert bigint to number
    return Number(value);
  }

  return typeof value === 'number' ? value : undefined;
}

/**
 * Process all potential number fields in an object to ensure they're compatible with Prisma
 * This handles timestamp fields and any other number fields that might be objects
 */
export function fixPrismaTypes<T extends Record<string, any>>(obj: T): any {
  const result = { ...obj } as any;

  // Process all properties that could be numeric
  for (const [key, val] of Object.entries(result)) {
    // Skip non-object and non-bigint values, except for keys that are likely to be timestamps
    const isLikelyTimestamp =
      key.toLowerCase().includes('time') ||
      key.toLowerCase().includes('timestamp') ||
      key.toLowerCase().includes('at');

    if (typeof val === 'object' || typeof val === 'bigint' || isLikelyTimestamp) {
      result[key] = fixComplexType(val);
    }
  }

  return result;
}

/** Transform object props value into Prisma-supported types */
export function transformPrisma<T extends Record<string, any>>(
  data: T,
  removeNullable = true,
): MakeTransformedPrisma<T> {
  const obj = { ...data } as any;

  for (const [key, val] of Object.entries(obj)) {
    if (val instanceof Uint8Array) {
      obj[key] = Buffer.from(val);
    } else if (typeof val === 'number' || val instanceof Long) {
      obj[key] = toNumber(val);
    } else if (removeNullable && (typeof val === 'undefined' || val === null)) {
      delete obj[key];
    }
  }

  return obj;
}

/** Transform prisma result into JSON serializable types */
export function serializePrisma<T extends Record<string, any>>(
  data: T,
  removeNullable = true,
): MakeSerializedPrisma<T> {
  const obj = { ...data } as any;

  for (const [key, val] of Object.entries(obj)) {
    if (val instanceof Buffer) {
      obj[key] = val.toJSON();
    } else if (typeof val === 'bigint' || val instanceof BigInt) {
      obj[key] = val.toString();
    } else if (removeNullable && (typeof val === 'undefined' || val === null)) {
      delete obj[key];
    }
  }

  return obj;
}
