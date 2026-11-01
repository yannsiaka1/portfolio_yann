// Outils de la scène 3D : courbes d'animation et géométrie des panneaux.
import * as THREE from 'three';

export const TAU = Math.PI * 2;
export const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

/** Cube unitaire aux arêtes arrondies : la brique de base de tous les symboles. */
export function roundedBox(radius = 0.14, steps = 3) {
  const seg = steps * 2 + 1;
  const geo = new THREE.BoxGeometry(1, 1, 1, seg, seg, seg).toNonIndexed();
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const half = 0.5 - radius;
  const hs = 0.5 / seg;
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    n.set(p.x - Math.sign(p.x) * hs, p.y - Math.sign(p.y) * hs, p.z - Math.sign(p.z) * hs).normalize();
    pos.setXYZ(i, half * Math.sign(p.x) + n.x * radius, half * Math.sign(p.y) + n.y * radius, half * Math.sign(p.z) + n.z * radius);
    nor.setXYZ(i, n.x, n.y, n.z);
  }
  geo.deleteAttribute('uv');
  return geo;
}
