import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readStorage, writeStorage } from '../utils/persistence';

// 상태 초기값을 localStorage에서 읽고, 값이 바뀔 때마다 다시 저장한다.
export function usePersistentState<T>(
  key: string,
  parse: (raw: unknown) => T | null,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStorage(localStorage, key, parse, fallback));

  useEffect(() => {
    writeStorage(localStorage, key, value);
  }, [key, value]);

  return [value, setValue];
}
