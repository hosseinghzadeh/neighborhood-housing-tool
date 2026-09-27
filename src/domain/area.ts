export type LngLat = [number, number]; // [lng, lat]

export interface School {
  name: string;
  stage: "F-3" | "F-6" | "F-9" | "4-9" | "7-9" | "Gymnasium";
  /** Demo indicator: share of pupils reaching goals in all subjects (%) */
  goalAttainmentPercent: number;
}

export interface CommuteTimes {
  /** Minutes by public transport, door-to-door estimate */
  stockholmCentral: number;
  kungstradgarden: number;
}

export interface Area {
  id: string;
  name: string;
  municipality: string;
  region: "Stockholm city" | "Greater Stockholm";
  /** Rough compass sector relative to central Stockholm */
  sector: "north" | "south" | "east" | "west" | "central";

  coordinates: { lat: number; lng: number };
  polygon: LngLat[];

  /** Normalized 0-100 indicator scores */
  safetyScore: number;
  schoolScore: number;
  educationScore: number;
  familyScore: number;

  averageApartmentPrice: number; // SEK, typical 3-room apartment
  averageHousePrice: number; // SEK, typical house

  universityEducatedPercent: number;
  /** Reported crime per 1 000 residents (demo index) */
  reportedCrimeIndex: number;

  nearbySchools: School[];
  commuteTimes: CommuteTimes;

  summary: string;
}

export type CommuteKey = keyof CommuteTimes;

export const COMMUTE_DESTINATIONS: Array<{
  key: CommuteKey;
  label: string;
  matches: string[];
}> = [
  {
    key: "kungstradgarden",
    label: "Kungsträdgården",
    matches: [
      "kungstradgarden",
      "kungstradgarden",
      "kungsträdgården",
      "kungsan",
      "city",
      "centrala stockholm",
    ],
  },
  {
    key: "stockholmCentral",
    label: "Stockholm Central",
    matches: ["stockholm central", "t-centralen", "centralen", "central station", "norrmalm"],
  },
];
