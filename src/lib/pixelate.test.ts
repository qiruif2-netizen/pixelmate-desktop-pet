import { describe, expect, it } from "vitest";
import { edgeBackgroundMask, extractPalette, nearestPaletteColor, paletteLevels, quantizeChannel } from "./pixelate";

describe("pixel palette helpers", () => {
  it("maps channel values to stable palette levels", () => {
    expect(quantizeChannel(0, 4)).toBe(0);
    expect(quantizeChannel(255, 4)).toBe(255);
    expect(quantizeChannel(130, 4)).toBe(170);
  });

  it("keeps palette level count in a useful range", () => {
    expect(paletteLevels(8)).toBe(2);
    expect(paletteLevels(27)).toBe(3);
    expect(paletteLevels(64)).toBe(4);
  });

  it("extracts colors from the source instead of inventing channel combinations", () => {
    const source = new Uint8ClampedArray([
      210, 160, 70, 255,
      194, 135, 45, 255,
      96, 74, 51, 255,
      55, 49, 42, 255,
    ]);
    const palette = extractPalette(source, 4);
    const mapped = nearestPaletteColor(203, 150, 60, palette);
    expect(mapped[0]).toBeGreaterThan(mapped[2]);
    expect(mapped[1]).toBeGreaterThan(mapped[2]);
  });

  it("removes only edge-connected background colors", () => {
    const data = new Uint8ClampedArray([
      245,245,245,255, 245,245,245,255, 245,245,245,255,
      245,245,245,255, 250,250,250,255, 245,245,245,255,
      245,245,245,255, 30,20,10,255,    245,245,245,255,
    ]);
    const mask = edgeBackgroundMask(data, 3, 3);
    expect(mask[0]).toBe(1);
    expect(mask[7]).toBe(0);
  });
});
