import { NextResponse } from 'next/server';

export const VALID_PHASES = ['企画', 'デザイン', '制作', '納品'] as const;
export type ValidPhase = (typeof VALID_PHASES)[number];

export function isValidPhase(value: unknown): value is ValidPhase {
  return typeof value === 'string' && (VALID_PHASES as readonly string[]).includes(value);
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
