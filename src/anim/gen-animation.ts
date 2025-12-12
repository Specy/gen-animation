import { el } from "./element";
import { ease } from "./tween";

export function* delay(frames: number): Generator<void> {
  for (let i = 0; i < frames; i++) {
    yield;
  }
}

export function* all(...gens: Generator<any>[]): Generator<any[]> {
  while (true) {
    const results = gens.map((g) => g.next());
    if (results.every((r) => r.done)) {
      return;
    }
    yield results.map((r) => r.value);
  }
}

export function* loop(
  times: number,
  generator: () => Generator<any>,
): Generator<any> {
  for (let i = 0; i < times; i++) {
    yield* generator();
  }
}

export function* sequence(
  delayFrames: number,
  generators: (() => Generator<any>)[],
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

export { el, ease };
