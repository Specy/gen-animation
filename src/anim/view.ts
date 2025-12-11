import type * as CSS from "csstype";
import type { EasingFunction } from "./tween";
import type { NumericProps } from "./utils";

export interface View {
  element: HTMLElement;
  setState(newState: Partial<Record<string, unknown>>): void;
  getState(): Record<string, unknown>;
  add(data: { element: ViewElement }): void;
  remove(data: { element: ViewElement }): void;
}

export interface ViewElement extends Disposable {
  element: HTMLElement;
  style: (p: CSS.Properties) => void;
  to: (
    p: Partial<NumericProps>,
    duration: number,
    easing?: EasingFunction | ((t: number) => number),
  ) => Generator;
}

export function view(
  style?: CSS.Properties,
  state: Record<string, unknown> = {},
) {
  const el = document.createElement("div");
  Object.assign(el.style, style);

  let _state = state;

  return {
    element: el,
    getState() {
      return _state;
    },
    setState(newState: Partial<unknown>) {
      _state = { ..._state, ...newState };
    },
    add(data: { element: ViewElement }) {
      el.appendChild(data.element.element);
    },
    remove(data: { element: ViewElement }) {
      el.removeChild(data.element.element);
    },
    clear() {
      el.innerHTML = "";
    },
    mount(parent: HTMLElement) {
      parent.appendChild(el);
    },
    unmount() {
      el.remove();
    },
  };
}