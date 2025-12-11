type State = {
  [key: string]: number | string;
};

const parseColor = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
};

const colorToHex = (r: number, g: number, b: number) => {
  const toHex = (c: number) => Math.round(c).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const easeOutQuad = (t: number) => t * (2 - t);

//generator function to ease from one state to another, allow for numbers and colors
function* tweenColor(
  from: State,
  to: State,
  duration: number,
  easingFn: (t: number) => number = (t) => t,
): Generator<State> {
  for (let i = 0; i <= duration; i++) {
    const progress = easingFn(i / duration);
    const newState: State = {};
    for (const key in from) {
      const start = from[key];
      const end = to[key];
      if (typeof start === "number" && typeof end === "number") {
        newState[key] = start + (end - start) * progress;
      } else if (
        typeof start === "string" &&
        typeof end === "string" &&
        start.startsWith("#")
      ) {
        const fromColor = parseColor(start);
        const toColor = parseColor(end);
        const r = fromColor.r + (toColor.r - fromColor.r) * progress;
        const g = fromColor.g + (toColor.g - fromColor.g) * progress;
        const b = fromColor.b + (toColor.b - fromColor.b) * progress;
        newState[key] = colorToHex(r, g, b);
      }
    }
    yield newState;
  }
}

function* linearColor(
  from: State,
  to: State,
  duration: number,
): Generator<State> {
  yield* tweenColor(from, to, duration);
}

function* easeOutColor(
  from: State,
  to: State,
  duration: number,
): Generator<State> {
  yield* tweenColor(from, to, duration, easeOutQuad);
}

export { tweenColor, linearColor, easeOutColor };
