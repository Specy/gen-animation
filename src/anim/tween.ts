type State = {
  [key: string]: number;
};

export type EasingFunction = "linear" | "easeOut" | "easeIn" | 'easeInOut'

export function ease(fn: EasingFunction | ((t: number) => number)) {
  if (typeof fn === 'function') {
    return fn;
  }
  switch (fn) {
    case 'linear':
      return (t: number) => t;
    case 'easeOut':
      return (t: number) => t * (2 - t);
    case 'easeIn':
      return (t: number) => t * t;
    case 'easeInOut':
      return (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    default:
      throw new Error(`Unknown easing function: ${fn}`);
  }
}

export function* tween(
  from: State,
  to: State,
  duration: number,
  easingFn: (t: number) => number,
): Generator<State> {
  for (let i = 0; i <= duration; i++) {
    const progress = easingFn(i / duration);
    const newState: State = {};
    for (const key in from) {
      const start = from[key];
      const end = to[key];
      newState[key] = start + (end - start) * progress;
    }
    yield newState;
  }
}