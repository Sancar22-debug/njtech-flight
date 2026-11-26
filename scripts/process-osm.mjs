import fs from 'node:fs';

const input = JSON.parse(fs.readFileSync(new URL('../data/campus-osm.json', import.meta.url), 'utf8'));
const origin = { lon: 118.6361144, lat: 32.0839058 };
const metersPerLon = 111320 * Math.cos(origin.lat * Math.PI / 180);
const metersPerLat = 110540;
const nodes = new Map();
const ways = new Map();

for (const element of input.elements) {
  if (element.type === 'node') nodes.set(element.id, element);
  if (element.type === 'way') ways.set(element.id, element);
}

function project(lon, lat) {
  return [
    Number(((lon - origin.lon) * metersPerLon).toFixed(2)),
    Number((-(lat - origin.lat) * metersPerLat).toFixed(2)),
  ];
}

function nodePoints(ids) {
  return ids.map((id) => nodes.get(id)).filter(Boolean);
}

function stitchedBoundary() {
  const relation = input.elements.find((element) => element.type === 'relation' && element.id === 15927775);
  const segments = relation.members
    .filter((member) => member.type === 'way' && member.role === 'outer')
    .map((member) => [...ways.get(member.ref).nodes]);
  const line = segments.shift();
  while (segments.length) {
    const last = line.at(-1);
    const index = segments.findIndex((segment) => segment[0] === last || segment.at(-1) === last);
    if (index < 0) break;
    let segment = segments.splice(index, 1)[0];
    if (segment.at(-1) === last) segment = segment.reverse();
    line.push(...segment.slice(1));
  }
  return nodePoints(line).map((node) => project(node.lon, node.lat));
}

const boundary = stitchedBoundary();

function inside(point, polygon = boundary) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, zi] = polygon[i];
    const [xj, zj] = polygon[j];
    if (((zi > point[1]) !== (zj > point[1])) &&
      (point[0] < ((xj - xi) * (point[1] - zi)) / (zj - zi) + xi)) result = !result;
  }
  return result;
}

function centroid(points) {
  const sum = points.reduce((acc, point) => [acc[0] + point[0], acc[1] + point[1]], [0, 0]);
  return [Number((sum[0] / points.length).toFixed(2)), Number((sum[1] / points.length).toFixed(2))];
}

function convertWay(way) {
  const points = nodePoints(way.nodes).map((node) => project(node.lon, node.lat));
  return {
    id: way.id,
    name: way.tags?.name || '',
    kind: way.tags?.building || way.tags?.highway || way.tags?.natural || way.tags?.leisure || way.tags?.landuse || '',
    levels: way.tags?.['building:levels'] ? Number(way.tags['building:levels']) : null,
    height: way.tags?.height ? Number.parseFloat(way.tags.height) : null,
    sport: way.tags?.sport || '',
    points,
    center: centroid(points),
  };
}

const buildings = [];
const roads = [];
const waters = [];
const green = [];
const sports = [];

for (const way of ways.values()) {
  if (!way.tags || !way.nodes?.length) continue;
  const converted = convertWay(way);
  if (!converted.points.length) continue;
  const touchesCampus = converted.points.some((point) => inside(point)) || inside(converted.center);
  if (!touchesCampus) continue;
  if (way.tags.building) buildings.push(converted);
  else if (way.tags.highway && !way.tags.tunnel) roads.push(converted);
  else if (way.tags.natural === 'water') waters.push(converted);
  else if (way.tags.leisure === 'pitch' || way.tags.leisure === 'track') sports.push(converted);
  else if (way.tags.leisure === 'park' || ['forest', 'grass', 'recreation_ground'].includes(way.tags.landuse)) green.push(converted);
}

const output = {
  meta: {
    source: 'OpenStreetMap contributors, ODbL 1.0',
    sourceUrl: 'https://www.openstreetmap.org/relation/15927775',
    retrieved: '2026-11-26',
    coordinateSystem: 'WGS84 converted to local metres; no GCJ-02 mixing',
    origin,
    generatedGeometry: 'Missing heights and architectural details are stylised, not measured.',
  },
  boundary,
  buildings,
  roads,
  waters,
  green,
  sports,
};

fs.writeFileSync(new URL('../src/data/campus.json', import.meta.url), JSON.stringify(output));
console.log(JSON.stringify({
  boundaryPoints: boundary.length,
  buildings: buildings.length,
  roads: roads.length,
  waters: waters.map((water) => water.name),
  sports: sports.map((sport) => sport.name),
  landmarks: buildings.filter((building) => ['逸夫图书馆', '厚学楼', '明德楼', '行健体育馆'].includes(building.name)).map((building) => ({ name: building.name, center: building.center, levels: building.levels })),
}, null, 2));
