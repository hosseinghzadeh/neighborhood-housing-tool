/**
 * Data provider adapters.
 *
 * The MVP ships a single seeded demo provider. Each interface below maps to a
 * real public source that can be implemented later without touching the
 * recommendation engine:
 *
 *   SCBDataProvider       -> Statistics Sweden (SCB): demographics, education
 *                            levels, households, DeSO/RegSO geography
 *   SchoolDataProvider    -> Skolverket: schools and academic statistics
 *   CrimeDataProvider     -> Brå: reported crime statistics
 *   TransportDataProvider -> Trafiklab: public transport routing / travel times
 *   HousingDataProvider   -> housing market sources: prices and listings
 *   GeographyProvider     -> DeSO / RegSO polygons
 *
 * The engine consumes only `Area` objects, so providers are swappable.
 */
import type { Area, CommuteTimes, LngLat, School } from "../../domain/area";

export interface DataSourceMeta {
  name: string;
  year: string;
  kind: "demo" | "official";
  note?: string;
}

export interface GeographyProvider {
  listAreas(regionId: string): Promise<Array<Pick<Area, "id" | "name" | "municipality">>>;
  getPolygon(areaId: string): Promise<LngLat[]>;
  meta(): DataSourceMeta;
}

export interface SCBDataProvider {
  getEducationLevel(areaId: string): Promise<{ universityEducatedPercent: number }>;
  getHouseholds(areaId: string): Promise<{ childHouseholdShare: number }>;
  meta(): DataSourceMeta;
}

export interface SchoolDataProvider {
  getSchools(areaId: string): Promise<School[]>;
  meta(): DataSourceMeta;
}

export interface CrimeDataProvider {
  getReportedCrimeIndex(areaId: string): Promise<number>;
  meta(): DataSourceMeta;
}

export interface TransportDataProvider {
  getCommuteTimes(areaId: string): Promise<CommuteTimes>;
  meta(): DataSourceMeta;
}

export interface HousingDataProvider {
  getPrices(areaId: string): Promise<{ averageApartmentPrice: number; averageHousePrice: number }>;
  meta(): DataSourceMeta;
}

export interface AreaRepository {
  getAreas(regionId: string): Area[];
  sources(): DataSourceMeta[];
}
