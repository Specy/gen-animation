
import { describe, it, expect } from 'vitest';
import { linear, easeOut, all } from './ease';

describe('linear', () => {
    it('should generate a sequence of states for numbers', () => {
        const from = { x: 0, y: 100 };
        const to = { x: 100, y: 0 };
        const duration = 10;
        const animation = linear(from, to, duration);
        const states = [...animation];
        expect(states).toHaveLength(duration + 1);
        expect(states[0]).toEqual({ x: 0, y: 100 });
        expect(states[5]).toEqual({ x: 50, y: 50 });
        expect(states[10]).toEqual({ x: 100, y: 0 });
    });
});

describe('easeOut', () => {
    it('should generate a sequence of states for numbers', () => {
        const from = { x: 0 };
        const to = { x: 100 };
        const duration = 10;
        const animation = easeOut(from, to, duration);
        const states = [...animation];
        expect(states).toHaveLength(duration + 1);
        expect(states[0]).toEqual({ x: 0 });
        expect(states[10]).toEqual({ x: 100 });
    });
});

describe('all', () => {
  it('should run generators concurrently', () => {
    function* gen1() {
      yield 1;
      yield 2;
    }

    function* gen2() {
      yield 'a';
      yield 'b';
      yield 'c';
    }

    const combined = all([gen1(), gen2()]);
    const result = [...combined];

    expect(result).toEqual([
      [1, 'a'],
      [2, 'b'],
      [undefined, 'c'],
    ]);
  });
});
