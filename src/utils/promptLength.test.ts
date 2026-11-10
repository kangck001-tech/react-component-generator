import { describe, it, expect } from 'vitest';
import { PROMPT_MAX_LENGTH, validatePromptLength } from './promptLength';

describe('validatePromptLength', () => {
  it('최대 길이는 500자다', () => {
    expect(PROMPT_MAX_LENGTH).toBe(500);
  });

  it('빈 문자열은 유효하고 길이는 0이다', () => {
    expect(validatePromptLength('')).toEqual({ valid: true, length: 0 });
  });

  it('입력 길이를 글자 수로 반환한다', () => {
    expect(validatePromptLength('프로필 카드').length).toBe(6);
  });

  it('정확히 500자는 유효하다', () => {
    const prompt = 'a'.repeat(500);
    expect(validatePromptLength(prompt)).toEqual({ valid: true, length: 500 });
  });

  it('501자는 유효하지 않다', () => {
    const prompt = 'a'.repeat(501);
    expect(validatePromptLength(prompt)).toEqual({ valid: false, length: 501 });
  });

  it('이모지는 서로게이트 쌍이 아니라 글자 1개로 센다', () => {
    const prompt = '😀'.repeat(500);
    expect(validatePromptLength(prompt)).toEqual({ valid: true, length: 500 });
  });
});
