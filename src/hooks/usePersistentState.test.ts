import { describe, it, expect, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePersistentState } from './usePersistentState';

const KEY = 'rcg:test';
const parseString = (raw: unknown) => (typeof raw === 'string' ? raw : null);

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 없으면 fallback으로 시작한다', () => {
    const { result } = renderHook(() => usePersistentState(KEY, parseString, 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('값을 바꾸면 localStorage에 저장된다', () => {
    const { result } = renderHook(() => usePersistentState(KEY, parseString, 'fallback'));
    act(() => result.current[1]('saved'));
    expect(localStorage.getItem(KEY)).toBe(JSON.stringify('saved'));
  });

  it('언마운트 후 다시 마운트해도(새로고침 효과) 마지막 값을 복원한다', () => {
    const first = renderHook(() => usePersistentState(KEY, parseString, 'fallback'));
    act(() => first.result.current[1]('kept'));
    first.unmount();

    const second = renderHook(() => usePersistentState(KEY, parseString, 'fallback'));
    expect(second.result.current[0]).toBe('kept');
  });
});
