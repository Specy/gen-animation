import type * as CSS from "csstype";
import { ease, tween, type EasingFunction } from "./ease";
import type { View, ViewElement } from "./view";
import type { NumericProps } from "./props";
import { numberOnly, toCssValue } from "./utils";

export function el(view: View, style?: CSS.Properties): ViewElement {
  const element = document.createElement("div");
  if (style) {
    Object.assign(element.style, style);
  }

  const viewElement = {
    element,
    style: (p: CSS.Properties) => {
      Object.assign(element.style, p);
    },

    to: function* (
      target: Partial<NumericProps>,
      duration: number,
      easing: EasingFunction | ((t: number) => number) = "linear",
    ) {
      const initial = numberOnly(window.getComputedStyle(element), target);

      const tweenGen = tween(initial, target, duration, ease(easing));
      for (const state of tweenGen) {
        Object.assign(element.style, toCssValue(state));
        yield state;
      }
    },

    [Symbol.dispose]() {
      view.remove({ element: viewElement });
      element.remove();
    },
  };
  view.add({ element: viewElement as any });

  return viewElement;
}
