import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {SCENES,fragmentFor} from '../engine.js';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('share metadata is present in the original HTML with a public HTTPS image',()=>{
  for(const property of ['og:type','og:title','og:description','og:image','og:image:width','og:image:height'])assert.match(html,new RegExp('property="'+property+'" content="[^"]+"'));
  assert.match(html,/property="og:image" content="https:\/\//);
  assert.match(html,/name="twitter:card" content="summary_large_image"/);
  assert.doesNotMatch(html,/toyota|gazoo|land cruiser/i);
});
test('social artwork is an actual 1200 by 630 JPEG',()=>{
  const jpg=readFileSync(new URL('../preview.jpg',import.meta.url));
  assert.equal(jpg.readUInt16BE(0),0xffd8);
  let offset=2,dimensions;
  while(offset<jpg.length){assert.equal(jpg[offset],0xff);const marker=jpg[offset+1],length=jpg.readUInt16BE(offset+2);if([0xc0,0xc1,0xc2].includes(marker)){dimensions=[jpg.readUInt16BE(offset+7),jpg.readUInt16BE(offset+5)];break;}offset+=length+2;}
  assert.deepEqual(dimensions,[1200,630]);
});
test('every preset has a static thumbnail',()=>{SCENES.forEach((s,i)=>assert.ok(existsSync(new URL('../previews/'+String(i+1).padStart(2,'0')+'.jpg',import.meta.url)),s.name));});
test('2D and 3D shader paths stay separate',()=>{
  assert.ok(!fragmentFor(0).includes('vec3 field3D'));
  assert.ok(!fragmentFor(8).includes('vec3 field2D'));
  assert.ok(fragmentFor(9).includes('distanceField'));
});
