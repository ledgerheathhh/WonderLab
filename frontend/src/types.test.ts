import { describe, it, expect } from "vitest";
import { interpolate } from "./types";
import { example } from "./examples";
describe("experiment model", () => {
  it("interpolates increasing and decreasing values without executing formulas", () => {
    expect(
      interpolate(
        [
          { x: 0, y: 0 },
          { x: 10, y: 100 },
        ],
        3,
      ),
    ).toBe(30);
    expect(
      interpolate(
        [
          { x: 0, y: 100 },
          { x: 10, y: 0 },
        ],
        3,
      ),
    ).toBe(70);
  });
  it("clamps to the model domain", () => {
    const points = [
      { x: 0, y: 3 },
      { x: 10, y: 20 },
    ];
    expect(interpolate(points, -1)).toBe(3);
    expect(interpolate(points, 11)).toBe(20);
  });
});
describe("curated learning experiences", () => {
  for (const lang of ["zh", "en"] as const)
    for (let i = 0; i < 3; i++)
      it(`has source-grounded activities for subject ${i} in ${lang}`, () => {
        const p = example(i, lang);
        expect(p.course.scenes.length).toBeGreaterThanOrEqual(2);
        expect(
          new Set(p.course.scenes.map((s) => s.type)).size,
        ).toBeGreaterThanOrEqual(2);
        for (const s of p.course.scenes) {
          expect(s.quote.length).toBeGreaterThan(0);
          expect(p.source).toContain(s.quote);
        }
      });
});
