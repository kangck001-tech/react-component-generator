import type { GeneratedComponent, Provider } from '../types';

export const STORAGE_KEYS = {
  apiKeys: 'rcg:apiKeys',
  provider: 'rcg:provider',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

export const PROMPT_HISTORY_LIMIT = 50;
export const DEFAULT_PROVIDER: Provider = 'google';

export type ApiKeys = Record<Provider, string>;
export const EMPTY_API_KEYS: ApiKeys = { anthropic: '', google: '' };

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const PROVIDERS: Provider[] = ['anthropic', 'google'];

// 저장된 값이 깨져 있어도 앱이 멈추지 않도록 parse 결과가 null이면 fallback을 쓴다.
export function readStorage<T>(
  storage: StorageLike,
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: T,
): T {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    return parse(JSON.parse(raw)) ?? fallback;
  } catch {
    return fallback;
  }
}

// 용량 초과나 시크릿 모드에서 저장이 실패해도 화면 동작은 유지한다.
export function writeStorage(storage: StorageLike, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패는 무시한다. 새로고침 후 복원만 되지 않는다.
  }
}

export function parseProvider(raw: unknown): Provider | null {
  return PROVIDERS.includes(raw as Provider) ? (raw as Provider) : null;
}

export function parseApiKeys(raw: unknown): ApiKeys | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const result = { ...EMPTY_API_KEYS };

  for (const provider of PROVIDERS) {
    const value = record[provider];
    if (value === undefined) continue;
    if (typeof value !== 'string') return null;
    result[provider] = value;
  }
  return result;
}

export function parsePromptHistory(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((item): item is string => typeof item === 'string').slice(0, PROMPT_HISTORY_LIMIT);
}

export function addToPromptHistory(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;
  return [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, PROMPT_HISTORY_LIMIT);
}

function isValidComponent(item: unknown): item is Omit<GeneratedComponent, 'createdAt'> & { createdAt: string } {
  if (typeof item !== 'object' || item === null) return false;
  const record = item as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.prompt === 'string' &&
    typeof record.code === 'string' &&
    typeof record.createdAt === 'string' &&
    !Number.isNaN(Date.parse(record.createdAt))
  );
}

// JSON에는 Date가 문자열로 저장되므로 createdAt을 다시 Date로 바꾼다.
export function parseComponents(raw: unknown): GeneratedComponent[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .filter(isValidComponent)
    .map((item) => ({ ...item, createdAt: new Date(item.createdAt) }));
}
