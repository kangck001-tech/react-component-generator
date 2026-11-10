import { describe, it, expect, vi } from 'vitest';
import {
  PROMPT_HISTORY_LIMIT,
  addToPromptHistory,
  parseApiKeys,
  parseComponents,
  parsePromptHistory,
  parseProvider,
  readStorage,
  writeStorage,
  type StorageLike,
} from './persistence';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

describe('readStorage / writeStorage', () => {
  it('저장된 값이 없으면 fallback을 반환한다', () => {
    const storage = createMemoryStorage();
    expect(readStorage(storage, 'k', (raw) => raw as string, 'fallback')).toBe('fallback');
  });

  it('JSON이 깨져 있으면 fallback을 반환하고 예외를 던지지 않는다', () => {
    const storage = createMemoryStorage({ k: '{broken' });
    expect(readStorage(storage, 'k', (raw) => raw as string, 'fallback')).toBe('fallback');
  });

  it('parse가 null을 반환하면 fallback을 반환한다', () => {
    const storage = createMemoryStorage({ k: JSON.stringify(42) });
    expect(readStorage(storage, 'k', () => null, 'fallback')).toBe('fallback');
  });

  it('writeStorage로 저장한 값을 readStorage로 다시 읽을 수 있다', () => {
    const storage = createMemoryStorage();
    writeStorage(storage, 'k', { a: 1 });
    expect(readStorage(storage, 'k', (raw) => raw as { a: number }, { a: 0 })).toEqual({ a: 1 });
  });

  it('저장소 쓰기가 실패해도 예외를 던지지 않는다 (용량 초과, 시크릿 모드)', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError');
      }),
    };
    expect(() => writeStorage(storage, 'k', 'v')).not.toThrow();
  });
});

describe('parseProvider', () => {
  it('유효한 provider 문자열을 그대로 반환한다', () => {
    expect(parseProvider('anthropic')).toBe('anthropic');
    expect(parseProvider('google')).toBe('google');
  });

  it('알 수 없는 값이나 문자열이 아니면 null을 반환한다', () => {
    expect(parseProvider('openai')).toBeNull();
    expect(parseProvider(42)).toBeNull();
  });
});

describe('parseApiKeys', () => {
  it('두 provider 키를 모두 가진 객체를 그대로 반환한다', () => {
    expect(parseApiKeys({ anthropic: 'a', google: 'g' })).toEqual({ anthropic: 'a', google: 'g' });
  });

  it('빠진 provider는 빈 문자열로 채운다', () => {
    expect(parseApiKeys({ anthropic: 'a' })).toEqual({ anthropic: 'a', google: '' });
  });

  it('객체가 아니거나 값이 문자열이 아니면 null을 반환한다', () => {
    expect(parseApiKeys(null)).toBeNull();
    expect(parseApiKeys('key')).toBeNull();
    expect(parseApiKeys({ anthropic: 1 })).toBeNull();
  });
});

describe('addToPromptHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToPromptHistory(['b', 'a'], 'c')).toEqual(['c', 'b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToPromptHistory(['b', 'a'], 'a')).toEqual(['a', 'b']);
  });

  it('앞뒤 공백을 제거하고, 빈 프롬프트는 무시한다', () => {
    expect(addToPromptHistory(['a'], '  b  ')).toEqual(['b', 'a']);
    expect(addToPromptHistory(['a'], '   ')).toEqual(['a']);
  });

  it(`최대 ${PROMPT_HISTORY_LIMIT}개까지만 유지한다`, () => {
    const full = Array.from({ length: PROMPT_HISTORY_LIMIT }, (_, i) => `p${i}`);
    const result = addToPromptHistory(full, 'new');
    expect(result).toHaveLength(PROMPT_HISTORY_LIMIT);
    expect(result[0]).toBe('new');
    expect(result).not.toContain(`p${PROMPT_HISTORY_LIMIT - 1}`);
  });
});

describe('parsePromptHistory', () => {
  it('문자열 배열만 남기고 나머지는 버린다', () => {
    expect(parsePromptHistory(['a', 1, null, 'b'])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parsePromptHistory({ a: 1 })).toBeNull();
  });
});

describe('parseComponents', () => {
  const valid = {
    id: '1-abc',
    prompt: '프로필 카드',
    code: 'export default () => null;',
    createdAt: '2026-11-10T01:00:00.000Z',
  };

  it('createdAt 문자열을 Date 객체로 복원한다', () => {
    const [component] = parseComponents([valid]) ?? [];
    expect(component.createdAt).toBeInstanceOf(Date);
    expect(component.createdAt.toISOString()).toBe(valid.createdAt);
  });

  it('필드가 빠지거나 형식이 틀린 항목은 버린다', () => {
    const result = parseComponents([valid, { id: 'x' }, { ...valid, createdAt: 'not-a-date' }]);
    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe(valid.id);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parseComponents('oops')).toBeNull();
  });
});
