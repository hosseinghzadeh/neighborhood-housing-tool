import type { LngLat } from "../../domain/area";
import type { BoundaryProvider, GeographicBoundary } from "../../domain/geography";

export interface BoundarySeed {
  areaId: string;
  lat: number;
  lng: number;
  /** Nominal neighbourhood radius in km. */
  radiusKm: number;
}

const mulberry = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/**
 * Neighbourhood-sized ring: a smoothly interpolated closed curve around the
 * centre point. Radii stay close to the nominal radius so a polygon reads as
 * one neighbourhood rather than a blob covering half a municipality.
 */
function ringFor(seed: BoundarySeed, salt: number): LngLat[] {
  const rnd = mulberry(salt);
  const controls = 8;
  const steps = 48;
  const radii = Array.from({ length: controls }, () => 0.86 + rnd() * 0.28);
  // Mild, stable anisotropy so shapes are not perfect circles.
  const stretch = 0.9 + rnd() * 0.25;

  const latDeg = seed.radiusKm / 111;
  const lngDeg = seed.radiusKm / (111 * Math.cos((seed.lat * Math.PI) / 180));

  const points: LngLat[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (i / steps) * controls;
    const i0 = Math.floor(t) % controls;
    const i1 = (i0 + 1) % controls;
    const f = (1 - Math.cos((t - Math.floor(t)) * Math.PI)) / 2; // cosine ease
    const r = radii[i0]! * (1 - f) + radii[i1]! * f;
    const a = (i / steps) * Math.PI * 2;
    points.push([
      seed.lng + Math.cos(a) * lngDeg * r * stretch,
      seed.lat + Math.sin(a) * latDeg * r,
    ]);
  }
  points.push(points[0]!);
  return points;
}

/** Placeholder provider — replace with SCB DeSO/RegSO geometry later. */
export function createDemoBoundaryProvider(seeds: BoundarySeed[]): BoundaryProvider {
  const map = new Map<string, GeographicBoundary>();
  seeds.forEach((seed, i) => {
    map.set(seed.areaId, {
      areaId: seed.areaId,
      source: "demo",
      ring: ringFor(seed, i * 7919 + 13),
      center: { lat: seed.lat, lng: seed.lng },
      approxRadiusKm: seed.radiusKm,
    });
  });

  return {
    source: "demo",
    get: (areaId) => map.get(areaId),
    list: () => [...map.values()],
  };
}
