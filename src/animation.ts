import { all } from "./anim/ease";
import { el } from "./anim/elements";
import type { View } from "./anim/view";

export function* playAnimation(view: View) {
  yield* all([
    square(view, 50, 100),
    square(view, 150, 100),
    square(view, 250, 100),
  ]);
}

export function* square(view: View, left: number, top: number) {
  using square = el(view, {
    width: "50px",
    height: "50px",
    backgroundColor: "red",
    position: "absolute",
    left: `${left}px`,
    top: `${top}px`,
  });

  yield* square.to({ left: left + 100, top, rotate: 180 }, 60);

  yield* square.to({ left, top, rotate: 0 }, 60);
}
