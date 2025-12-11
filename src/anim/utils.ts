import type * as CSS from "csstype";



export type NumericProps = {
  width: number;
  height: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
  margin: number;
  padding: number;
  border: number;
  borderRadius: number;
  borderWidth: number;
  borderLeftWidth: number;
  borderRightWidth: number;
  borderTopWidth: number;
  borderBottomWidth: number;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  opacity: number;
  zIndex: number;
  
  //all transfroms
  translateX: number;
  translateY: number;
  scale: number;
  scaleX: number;
  scaleY: number;
  rotate: number;
  skewX: number;
  skewY: number;
  perspective: number;
  
};


// Properties that use degrees
const DEGREE_PROPS = new Set(["rotate", "skewX", "skewY"]);

// Properties that have no unit (unitless)
const UNITLESS_PROPS = new Set([
  "opacity",
  "zIndex",
  "scale",
  "scaleX",
  "scaleY",
  "fontWeight",
]);

export function numberOnly(
  computedStyle: CSSStyleDeclaration,
  props: Partial<NumericProps>,
): Record<string, number> {
  return fromCssValue(
    computedStyle,
    Object.keys(props) as Array<keyof NumericProps>,
  );
}

export function fromCssValue(
  computedStyle: CSSStyleDeclaration,
  keys: Array<keyof NumericProps>,
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const key of keys) {
    const cssValue = computedStyle[key as any];

    if (!cssValue) {
      result[key] = 0;
      continue;
    }

    let numericValue: number;

    if (typeof cssValue === "string") {
      // Parse the numeric value from the string, regardless of unit
      numericValue = parseFloat(cssValue);
    } else {
      numericValue = parseFloat(String(cssValue));
    }

    if (!isNaN(numericValue)) {
      result[key] = numericValue;
    } else {
      result[key] = 0;
    }
  }

  return result;
}

export function toCssValue(record: Partial<NumericProps>): CSS.Properties {
  const result: Record<string, string> = {};

  for (const key of Object.keys(record)) {
    const value = record[key as keyof NumericProps];

    if (DEGREE_PROPS.has(key)) {
      result[key] = `${value}deg`;
    } else if (UNITLESS_PROPS.has(key)) {
      result[key] = `${value}`;
    } else {
      result[key] = `${value}px`;
    }
  }
  return result;
}
