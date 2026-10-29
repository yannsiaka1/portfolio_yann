// Outils de la scène 3D : courbes d'animation, géométrie des panneaux, texture des paquets.
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

/** Ré-échantillonne une polyligne tous les `step` pour animer son tracé point par point. */
export function resample(pts, step) {
  const out = [pts[0].clone()];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const n = Math.max(1, Math.round(a.distanceTo(b) / step));
    for (let k = 1; k <= n; k++) out.push(a.clone().lerp(b, k / n));
  }
  return out;
}

/** Point lumineux ambré, dessiné dans un canvas (aucune image à charger). */
export function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,214,140,.9)');
  grd.addColorStop(1, 'rgba(255,176,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
