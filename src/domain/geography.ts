import type { LngLat } from "./area";

/**
 * Geometry is deliberately kept separate from area metrics and scoring.
 *
 *   Area (identity) + GeographicBoundary (geometry) + AreaMetrics + PersonalizedScore
 *
 * The demo provider below can be swapped for real statistical geographies
 * (SCB DeSO / RegSO, municipality boundaries) without touching the
 * recommendation engine or the map rendering code.
 */
export type BoundarySource = "demo" | "deso" | "regso" | "municipality";

export interface GeographicBoundary {
  areaId: string;
  source: BoundarySource;
  /** Outer ring in [lng, lat] order, first point repeated at the end. */
  ring: LngLat[];
  center: { lat: number; lng: number };
  /** Approximate extent, useful for zoom heuristics. */
  approxRadiusKm: number;
}

export interface BoundaryProvider {
  source: BoundarySource;
  get(areaId: string): GeographicBoundary | undefined;
  list(): GeographicBoundary[];
}
