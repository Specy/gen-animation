type State = {
  [key: string]: number;
};

export type EasingFunction = "linear" | "easeOut";

export function ease(fn: EasingFunction | ((t: number) => number)) {
  if (typeof fn === 'function') {
    return fn;
  }
  switch (fn) {
    case 'linear':
      return (t: number) => t;
    case 'easeOut':
      return (t: number) => t * (2 - t);
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

export function* linear(
  from: State,
  to: State,
  duration: number,
): Generator<State> {
  yield* tween(from, to, duration, (t) => t);
}

export function* easeOut(
  from: State,
  to: State,
  duration: number,
): Generator<State> {
  yield* tween(from, to, duration, (t) => t * (2 - t));
}

export function* all(generators: Generator<any>[]): Generator<any[]> {
  const gens = [...generators];
  while (true) {
    const results = gens.map((g) => g.next());
    if (results.every((r) => r.done)) {
      return;
    }
    yield results.map((r) => r.value);
  }
}

export function* delay(frames: number): Generator<void> {
  for (let i = 0; i < frames; i++) {
    yield;
  }
}

export function* repeat(
  times: number,
  generator: () => Generator<any>,
): Generator<any> {
  for (let i = 0; i < times; i++) {
    const gen = generator();
    let result = gen.next();
    while (!result.done) {
      yield result.value;
      result = gen.next();
    }
  }
}

export function* sequence(
  delayFrames: number,
  generators: (() => Generator<any>)[]
): Generator<any[]> {
  const activeGens: (Generator<any> | null)[] = [];
  const pendingGens = [...generators];
  let frameCount = 0;

  while (activeGens.some((g) => g !== null) || pendingGens.length > 0) {
    // Start a new generator every delayFrames
    if (frameCount % delayFrames === 0 && pendingGens.length > 0) {
      activeGens.push(pendingGens.shift()!());
    }

    // Step all active generators
    const results = activeGens.map((g) => {
      if (g === null) return { done: true, value: undefined };
      return g.next();
    });

    // Mark completed generators as null
    results.forEach((r, i) => {
      if (r.done) activeGens[i] = null;
    });

    yield results.map((r) => r.value);
    frameCount++;
  }
}
