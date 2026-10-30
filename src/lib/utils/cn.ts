/**
 * VyaparSuite Design System - Class Name Utility
 * Fast, zero-dependency conditional class merger.
 */

export type ClassValue =
  | string
  | number
  | bigint
  | boolean
  | undefined
  | null
  | Record<string, boolean | null | undefined>
  | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input));
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (Boolean(value)) {
          classes.push(key);
        }
      }
    }
  }

  return classes.join(' ');
}
