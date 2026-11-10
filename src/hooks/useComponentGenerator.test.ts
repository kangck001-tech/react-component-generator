import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';
import { STORAGE_KEYS } from '../utils/persistence';

describe('useComponentGenerator 저장 유지', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ code: 'export default () => null;' }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('생성 성공 시 프롬프트 히스토리에 추가된다', async () => {
    const { result } = renderHook(() => useComponentGenerator());

    await act(() => result.current.generate('프로필 카드', undefined, 'google'));

    expect(result.current.promptHistory).toEqual(['프로필 카드']);
  });

  it('새로 마운트해도 생성된 컴포넌트와 프롬프트 히스토리가 복원된다', async () => {
    const first = renderHook(() => useComponentGenerator());
    await act(() => first.result.current.generate('검색 필터 바', undefined, 'google'));
    await waitFor(() => expect(first.result.current.components).toHaveLength(1));
    first.unmount();

    const second = renderHook(() => useComponentGenerator());
    expect(second.result.current.components[0].prompt).toBe('검색 필터 바');
    expect(second.result.current.components[0].createdAt).toBeInstanceOf(Date);
    expect(second.result.current.promptHistory).toEqual(['검색 필터 바']);
  });

  it('저장소에 저장된 컴포넌트 키를 사용한다', async () => {
    const { result } = renderHook(() => useComponentGenerator());
    await act(() => result.current.generate('배지', undefined, 'google'));

    expect(localStorage.getItem(STORAGE_KEYS.components)).toContain('배지');
  });
});
