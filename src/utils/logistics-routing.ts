// Utilities for logistics route visualization: great-circle flights and sea paths via a waypoint graph
// NOTE: Coordinates are [lat, lng]

import { greatCircle } from '@turf/turf';

export type LatLng = [number, number];

// Haversine distance in kilometers
function haversine(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Create a great-circle arc for flights (returns [lat,lng] points)
export function computeGreatCircle(origin: LatLng, dest: LatLng, npoints = 64): LatLng[] {
  try {
    const line = greatCircle(
      [origin[1], origin[0]],
      [dest[1], dest[0]],
      { npoints }
    );
    const coords = (line.geometry?.coordinates || []) as [number, number][];
    return coords.map(([lng, lat]) => [lat, lng]);
  } catch {
    // Fallback to simple straight line
    return [origin, dest];
  }
}

// SEA ROUTING
// A curated maritime waypoint graph covering Eastern Mediterranean, Suez, Red Sea, Arabian Sea, and Gulf
// Edges are defined to avoid land crossings and follow common shipping corridors
const SEA_NODES: Record<string, LatLng> = {
  latakia: [35.5138, 35.78],
  beirut: [33.901, 35.4951],
  mersin: [36.8, 34.63],
  limassol: [34.9174, 33.6290],
  piraeus: [37.9420, 23.6463],
  sicily: [37.0, 15.0],
  port_said: [31.265, 32.301], // Suez north entrance
  suez: [29.973, 32.549], // Suez south exit
  alexandria: [31.2001, 29.9187],
  jeddah: [21.5433, 39.1728],
  bab_el_mandeb: [12.6, 43.4],
  arabian_sea: [21.5, 62.0],
  hormuz: [26.0, 56.0],
  dubai: [25.2867, 55.3364],
  gibraltar: [36.0, -5.0],
  marseille: [43.2965, 5.3698],
  naples: [40.8518, 14.2681],
  rotterdam: [51.9225, 4.4792],
  hamburg: [53.5511, 9.9937],
};

// Undirected edges between nodes (plausible lanes that avoid land)
const SEA_EDGES: [keyof typeof SEA_NODES, keyof typeof SEA_NODES][] = [
  // East Med
  ['latakia', 'limassol'],
  ['beirut', 'limassol'],
  ['mersin', 'limassol'],
  ['limassol', 'piraeus'],
  ['piraeus', 'sicily'],
  ['sicily', 'marseille'],
  ['marseille', 'gibraltar'],
  ['sicily', 'naples'],
  ['naples', 'marseille'],
  // Suez / Red Sea / Gulf
  ['limassol', 'port_said'],
  ['port_said', 'suez'],
  ['suez', 'jeddah'],
  ['jeddah', 'bab_el_mandeb'],
  ['bab_el_mandeb', 'arabian_sea'],
  ['arabian_sea', 'hormuz'],
  ['hormuz', 'dubai'],
  // Europe northbound sample corridors
  ['gibraltar', 'rotterdam'],
  ['rotterdam', 'hamburg'],
];

// Build adjacency list
const ADJ: Record<string, { to: string; w: number }[]> = {};
for (const [a, b] of SEA_EDGES) {
  const wa = haversine(SEA_NODES[a], SEA_NODES[b]);
  if (!ADJ[a]) ADJ[a] = [];
  if (!ADJ[b]) ADJ[b] = [];
  ADJ[a].push({ to: b, w: wa });
  ADJ[b].push({ to: a, w: wa });
}

function nearestNode(p: LatLng): string {
  let best = Object.keys(SEA_NODES)[0];
  let bestD = Infinity;
  for (const k of Object.keys(SEA_NODES)) {
    const d = haversine(p, SEA_NODES[k]);
    if (d < bestD) {
      bestD = d;
      best = k;
    }
  }
  return best;
}

function dijkstra(start: string, goal: string): string[] {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited: Record<string, boolean> = {};
  Object.keys(SEA_NODES).forEach((k) => {
    dist[k] = Infinity;
    prev[k] = null;
  });
  dist[start] = 0;

  while (true) {
    let u: string | null = null;
    let uDist = Infinity;
    for (const k of Object.keys(SEA_NODES)) {
      if (!visited[k] && dist[k] < uDist) {
        u = k;
        uDist = dist[k];
      }
    }
    if (u === null) break;
    if (u === goal) break;
    visited[u] = true;

    for (const { to, w } of ADJ[u] || []) {
      const alt = dist[u] + w;
      if (alt < dist[to]) {
        dist[to] = alt;
        prev[to] = u;
      }
    }
  }

  const path: string[] = [];
  let cur: string | null = goal;
  while (cur) {
    path.unshift(cur);
    cur = prev[cur];
  }
  if (path[0] !== start) return [];
  return path;
}

// Compute a sea path strictly via the sea waypoint graph
export function computeSeaPath(origin: LatLng, dest: LatLng): LatLng[] {
  const s = nearestNode(origin);
  const g = nearestNode(dest);
  const pathNodes = dijkstra(s, g);
  if (pathNodes.length === 0) {
    // Fallback: simple two-leg path via a safe offshore point
    const mid: LatLng = [34.0, 34.0]; // East Med offshore
    return [origin, mid, dest];
  }
  const pathCoords: LatLng[] = [origin];
  for (const k of pathNodes) pathCoords.push(SEA_NODES[k]);
  pathCoords.push(dest);
  return pathCoords;
}
