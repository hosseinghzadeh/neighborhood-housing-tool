import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Polygon, TileLayer, Tooltip, useMap, useMapEvent } from "react-leaflet";
import L, { type LatLngExpression, type LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Area } from "../../domain/area";
import {
  TIER_BORDER_COLOR,
  TIER_COLOR,
  TIER_LABEL,
  TIER_STYLE,
  matchTier,
  type Recommendation,
} from "../../domain/recommendation";

const STOCKHOLM_CENTER: LatLngExpression = [59.34, 18.04];

const NEUTRAL_FILL = "#a9b0ba";
const NEUTRAL_BORDER = "#8b93a0";

/**
 * Camera policy:
 *  - fit once to the strongest matches when a new ranking arrives
 *  - never move on selection unless the selected area is off-screen, and then
 *    only pan (never change zoom)
 */
function CameraController({
  target,
  fitTo,
}: {
  target: { lat: number; lng: number } | null;
  fitTo: LatLngBoundsExpression | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (fitTo) map.flyToBounds(fitTo, { padding: [70, 70], duration: 1.1, maxZoom: 12 });
  }, [map, fitTo]);

  useEffect(() => {
    if (!target) return;
    const point = L.latLng(target.lat, target.lng);
    // Only intervene when the selection sits outside the visible viewport.
    if (map.getBounds().pad(-0.12).contains(point)) return;
    map.panTo(point, { animate: true, duration: 0.7 });
  }, [map, target]);

  return null;
}

function BackgroundClick({ onClear }: { onClear: () => void }) {
  useMapEvent("click", () => onClear());
  return null;
}

export interface MapProps {
  areas: Area[];
  recommendations: Recommendation[];
  hasProfile: boolean;
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onClearSelection: () => void;
}

export default function StockholmMapClient({
  areas,
  recommendations,
  hasProfile,
  selectedId,
  hoveredId,
  onSelect,
  onHover,
  onClearSelection,
}: MapProps) {
  const byId = useMemo(() => {
    const m = new Map<string, Recommendation>();
    recommendations.forEach((r) => m.set(r.area.id, r));
    return m;
  }, [recommendations]);

  // Fit only when the ranking itself changes, not when a selection changes.
  const fitKey = useMemo(
    () =>
      hasProfile
        ? recommendations
            .slice(0, 5)
            .map((r) => r.area.id)
            .join("|")
        : "",
    [hasProfile, recommendations],
  );
  const fitRef = useRef<LatLngBoundsExpression | null>(null);
  const fitKeyRef = useRef<string>("");
  if (fitKey !== fitKeyRef.current) {
    fitKeyRef.current = fitKey;
    fitRef.current = fitKey
      ? recommendations
          .slice(0, 5)
          .map((r) => [r.area.coordinates.lat, r.area.coordinates.lng] as [number, number])
      : null;
  }
  const fitTo = fitRef.current;

  const selectedArea = useMemo(
    () => areas.find((a) => a.id === selectedId)?.coordinates ?? null,
    [areas, selectedId],
  );

  // Draw weaker matches first so the strongest polygons sit on top.
  const ordered = useMemo(() => {
    const rank = (id: string) => byId.get(id)?.personalizedScore ?? 0;
    const base = hasProfile ? [...areas].sort((a, b) => rank(a.id) - rank(b.id)) : areas;
    if (!selectedId) return base;
    return [...base.filter((a) => a.id !== selectedId), ...base.filter((a) => a.id === selectedId)];
  }, [areas, byId, hasProfile, selectedId]);

  return (
    <MapContainer
      center={STOCKHOLM_CENTER}
      zoom={11}
      minZoom={9}
      maxZoom={17}
      zoomControl
      className="h-full w-full"
      preferCanvas={false}
    >
      {/* Real-estate style base: water, parks and roads stay legible */}
      <TileLayer
        attribution="Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={19}
      />

      <CameraController target={selectedArea} fitTo={fitTo} />
      <BackgroundClick onClear={onClearSelection} />

      {ordered.map((area) => {
        const rec = byId.get(area.id);
        const score = rec?.personalizedScore;
        const scored = hasProfile && score !== undefined;
        const tier = scored ? matchTier(score) : null;
        const selected = selectedId === area.id;
        const hovered = hoveredId === area.id;

        const fill = tier ? TIER_COLOR[tier] : NEUTRAL_FILL;
        const stroke = selected ? "#1b2534" : tier ? TIER_BORDER_COLOR[tier] : NEUTRAL_BORDER;
        const base = tier ? TIER_STYLE[tier] : { fillOpacity: 0.05, weight: 0.8, opacity: 0.35 };

        const fillOpacity = selected
          ? Math.min(0.85, base.fillOpacity + 0.18)
          : hovered
            ? Math.min(0.78, base.fillOpacity + 0.07)
            : base.fillOpacity;

        return (
          <Polygon
            key={area.id}
            positions={area.polygon.map(([lng, lat]) => [lat, lng] as [number, number])}
            pathOptions={{
              color: stroke,
              weight: selected ? 3 : hovered ? base.weight + 0.6 : base.weight,
              opacity: selected ? 1 : base.opacity,
              fillColor: fill,
              fillOpacity,
              lineJoin: "round",
            }}
            eventHandlers={{
              click: (e) => {
                // Never let a polygon click reach the map background handler.
                L.DomEvent.stopPropagation(e);
                onSelect(area.id);
              },
              mouseover: () => onHover(area.id),
              mouseout: () => onHover(null),
            }}
          >
            <Tooltip direction="top" sticky className="af-tooltip" opacity={1}>
              <div className="min-w-[9.5rem]">
                <div className="text-[13px] font-semibold leading-tight text-text-primary">
                  {area.name}
                </div>
                <div className="text-[11px] text-text-secondary">{area.municipality}</div>
                {tier && score !== undefined ? (
                  <div className="mt-1.5 flex items-baseline gap-1.5">
                    <span
                      className="font-mono text-[14px] font-semibold tabular-nums"
                      style={{ color: TIER_BORDER_COLOR[tier] }}
                    >
                      {score}%
                    </span>
                    <span className="text-[11px] text-text-secondary">{TIER_LABEL[tier]}</span>
                  </div>
                ) : (
                  <div className="mt-1 max-w-[11rem] text-[11px] leading-snug text-text-secondary">
                    Describe your household to score this area
                  </div>
                )}
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </MapContainer>
  );
}
