export const PROMPT_MAX_LENGTH = 500;

export interface PromptLengthResult {
  valid: boolean;
  length: number;
}

// 이모지 등 서로게이트 쌍을 글자 1개로 세기 위해 코드 포인트 기준으로 센다.
export function validatePromptLength(prompt: string): PromptLengthResult {
  const length = [...prompt].length;
  return { valid: length <= PROMPT_MAX_LENGTH, length };
}
