/**
 * generate-world-zones.cjs
 *
 * Converts world-atlas TopoJSON → GeoJSON and tags each country feature
 * with the sub-zone it geographically belongs to (centroid lookup).
 *
 * Usage:  node scripts/generate-world-zones.cjs
 * Output: public/data/world-zones.geojson
 */

const topojson = require("topojson-client");
const fs = require("fs");
const path = require("path");

const publicData = path.join(__dirname, "..", "public", "data");

// ── Load source files ──────────────────────────────────────────
const world = JSON.parse(
  fs.readFileSync(path.join(publicData, "world-110m.json"), "utf8")
);
const subZones = JSON.parse(
  fs.readFileSync(path.join(publicData, "sub-zones.json"), "utf8")
);

// ── Convert TopoJSON → GeoJSON ─────────────────────────────────
const countries = topojson.feature(world, world.objects.countries);

// ── Pre-compute sub-zone bounding boxes ───────────────────────
const szBounds = subZones.map((sz) => {
  const coords = sz.geojson.coordinates[0];
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  return {
    id: sz.id,
    name: sz.name,
    terrain_type: sz.terrain_type,
    yield_modifier: sz.yield_modifier,
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
});

// ── Compute weighted centroid of a GeoJSON geometry ─────────────
// For MultiPolygon: averages polygon bbox-centres weighted by bbox area,
// skipping individual polygons that cross the antimeridian so that countries
// like Russia land in Siberia rather than the middle of the Pacific.
function weightedCentroid(geometry) {
  let totalWeight = 0;
  let totalLng = 0;
  let totalLat = 0;

  function processRing(ring) {
    const lngs = ring.map((c) => c[0]);
    const lats = ring.map((c) => c[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    // Skip rings that cross the antimeridian
    if (maxLng - minLng > 180) return;
    const weight = (maxLng - minLng) * (maxLat - minLat) + 0.001; // +epsilon for tiny islands
    totalWeight += weight;
    totalLng += ((minLng + maxLng) / 2) * weight;
    totalLat += ((minLat + maxLat) / 2) * weight;
  }

  if (geometry.type === "Polygon") {
    processRing(geometry.coordinates[0]);
  } else if (geometry.type === "MultiPolygon") {
    for (const poly of geometry.coordinates) processRing(poly[0]);
  }

  if (totalWeight === 0) return [0, 0]; // fallback (Antarctica etc.)
  return [totalLng / totalWeight, totalLat / totalWeight];
}

// ── Pre-compute sub-zone centres for nearest-zone fallback ────
const szCentres = szBounds.map((sz) => ({
  ...sz,
  cLng: (sz.minLng + sz.maxLng) / 2,
  cLat: (sz.minLat + sz.maxLat) / 2,
}));

function nearestSzFallback(lng, lat) {
  let best = null;
  let bestDist = Infinity;
  for (const sz of szCentres) {
    const d = (lng - sz.cLng) ** 2 + (lat - sz.cLat) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = sz;
    }
  }
  return best;
}

// ── Map each country to a sub-zone ────────────────────────────
let mapped = 0;
let fallback = 0;
const enriched = countries.features.map((feature) => {
  const [cLng, cLat] = weightedCentroid(feature.geometry);

  // 1. Try exact bounding-box match
  let match = szBounds.find(
    (sz) =>
      cLng >= sz.minLng &&
      cLng <= sz.maxLng &&
      cLat >= sz.minLat &&
      cLat <= sz.maxLat
  );

  // 2. Fall back to nearest sub-zone by centroid distance
  if (!match) {
    match = nearestSzFallback(cLng, cLat);
    if (match) fallback++;
  }

  if (match && !fallback) mapped++;
  else if (match) mapped++;

  return {
    type: "Feature",
    id: feature.id,
    geometry: feature.geometry,
    properties: {
      name: feature.properties?.name ?? null,
      sub_zone_id: match?.id ?? null,
      sub_zone_name: match?.name ?? null,
      terrain_type: match?.terrain_type ?? null,
      yield_modifier: match?.yield_modifier ?? null,
    },
  };
});

// ── Write output ───────────────────────────────────────────────
const output = { type: "FeatureCollection", features: enriched };
const outPath = path.join(publicData, "world-zones.geojson");
fs.writeFileSync(outPath, JSON.stringify(output));

const fileSizeKB = Math.round(fs.statSync(outPath).size / 1024);
console.log(`✅  world-zones.geojson written (${fileSizeKB} KB)`);
console.log(
  `    ${enriched.length} countries total · ${mapped} mapped (${fallback} via fallback)`
);

// Print any truly unmapped countries
const unmapped = enriched
  .filter((f) => !f.properties.sub_zone_id)
  .map((f) => f.properties.name);
if (unmapped.length) {
  console.log(`    Still unmapped: ${unmapped.join(", ")}`);
} else {
  console.log("    All countries mapped ✓");
}
