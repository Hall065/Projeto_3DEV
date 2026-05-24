const SENAI_LAT = Number(process.env.EXPO_PUBLIC_SENAI_LATITUDE ?? -22.5648);
const SENAI_LNG = Number(process.env.EXPO_PUBLIC_SENAI_LONGITUDE ?? -47.4014);
const SENAI_RADIUS = Number(process.env.EXPO_PUBLIC_SENAI_RAIO_METROS ?? 150);

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function distanceInMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const earthRadius = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isInsideSenaiPerimeter(lat: number, lng: number): boolean {
  return distanceInMeters(lat, lng, SENAI_LAT, SENAI_LNG) <= SENAI_RADIUS;
}

export const senaiCampus = {
  latitude: SENAI_LAT,
  longitude: SENAI_LNG,
  radiusMeters: SENAI_RADIUS,
};
