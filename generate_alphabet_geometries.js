import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fs from 'node:fs';

const fontData = JSON.parse(fs.readFileSync('assets/fonts/helvetiker_bold.typeface.json', 'utf8'));
const loader = new FontLoader();
const font = loader.parse(fontData);

const letters = ['A', 'I', 'u', 'e', 'o'];
const result = {};

for (const char of letters) {
  // Letters: Uppercase 'A', 'I' and lowercase 'u', 'e', 'o' as requested
  const geo = new TextGeometry(char, {
    font,
    size: 1.4,
    depth: 0.5,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.06,
    bevelOffset: 0,
    bevelSegments: 4
  });

  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.center();

  const posAttr = geo.attributes.position;
  const normAttr = geo.attributes.normal;
  const indexAttr = geo.index;

  const positions = Array.from(posAttr.array);
  const normals = Array.from(normAttr.array);
  const indices = indexAttr ? Array.from(indexAttr.array) : null;

  result[char] = {
    positions,
    normals,
    indices,
    count: posAttr.count
  };

  console.log(`Letter ${char}: ${posAttr.count} vertices, ${indices ? indices.length / 3 : 0} triangles`);
}

fs.writeFileSync('assets/models/home/letters_data.json', JSON.stringify(result));
console.log('Successfully saved to assets/models/home/letters_data.json');
