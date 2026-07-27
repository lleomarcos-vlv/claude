import { z } from 'zod';

/** WGS-84 coordinate. Longitude first is the PostGIS convention; we keep an
 * explicit object to avoid tuple ordering bugs across the stack. */
export const LatLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type LatLng = z.infer<typeof LatLngSchema>;

/** A polygon the client can draw on the map to delimit the work area. */
export const AreaPolygonSchema = z.object({
  points: z.array(LatLngSchema).min(3),
  /** Computed area in m² (client-side or server-side via PostGIS ST_Area). */
  areaM2: z.number().nonnegative().optional(),
});
export type AreaPolygon = z.infer<typeof AreaPolygonSchema>;

export const AddressSchema = z.object({
  label: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string(),
  state: z.string().length(2),
  zipCode: z.string().optional(),
  country: z.string().default('BR'),
  location: LatLngSchema,
});
export type Address = z.infer<typeof AddressSchema>;

/** Live tracking ping emitted by a gardener's device during ENROUTE. */
export const TrackingPingSchema = z.object({
  jobId: z.string(),
  gardenerId: z.string(),
  location: LatLngSchema,
  headingDeg: z.number().min(0).max(360).optional(),
  speedKmh: z.number().nonnegative().optional(),
  etaSeconds: z.number().nonnegative().optional(),
  at: z.string().datetime(),
});
export type TrackingPing = z.infer<typeof TrackingPingSchema>;

/** Haversine distance in kilometres between two coordinates. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
