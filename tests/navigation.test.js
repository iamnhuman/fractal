import test from 'node:test';
import assert from 'node:assert/strict';
import {InfiniteCamera} from '../navigation.js';
import {SCENES,GEOMETRIES} from '../engine.js';
import {dynamics,add,sub,mul,power,iterateOffset,linearize,escapeValue,spongeDistance,magnitude} from '../fractal-math.js';
const near=(a,b,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b}`);
const vectorNear=(a,b,tol=1e-8)=>a.forEach((v,i)=>near(v,b[i],tol));
test('ten scenes include eight polynomial Julia sets and two self-similar volumes',()=>{assert.equal(SCENES.length,10);assert.equal(new Set(SCENES.map(s=>s.type)).size,10);assert.equal(GEOMETRIES.length,10);assert.equal(SCENES.filter(s=>s.type>=8).length,2);});
test('every 2D flight targets a repelling fixed point on its Julia set',()=>{
  for(const scene of SCENES.slice(0,8)){
    const m=dynamics(scene.type,scene.c);
    assert.ok(m.ratio>1.4);
    vectorNear(add(power(m.fixed,m.degree),scene.c),m.fixed,1e-9);
    vectorNear(iterateOffset([0,0],m),[0,0]);
    assert.equal(escapeValue([0,0],0,m),null);
    assert.equal(escapeValue([0,0],10000,m),null);
  }
});
test('chart changes follow the SAME polynomial, instead of mixing unrelated fractals',()=>{
  for(const scene of SCENES.slice(0,8)){
    const m=dynamics(scene.type,scene.c);
    for(const depth of [0,1,3,10,20])for(const q of [[.04,.015],[-.03,.035],[.02,-.05]]){
      const before=iterateOffset(linearize(q,depth,m),m);
      const after=linearize(mul(m.multiplier,q),depth+1,m);
      vectorNear(after,before,1e-7);
    }
  }
});
test('the rendered escape field stays continuous across a complete zoom period',()=>{
  let checked=0;
  for(const scene of SCENES.slice(0,8)){
    const m=dynamics(scene.type,scene.c);
    for(let y=-4;y<=4;y++)for(let x=-6;x<=6;x++){
      const q=[x*.071+.013,y*.063+.011],a=escapeValue(q,3,m,720),b=escapeValue(mul(q,m.multiplier),4,m,719);
      assert.equal(a===null,b===null,`${scene.name}: membership changed at ${q}`);
      if(a!==null){near(a,b,1e-5);checked++;}
    }
  }
  assert.ok(checked>300);
});
test('camera flies beyond 10^1000 while staying on the same existing detail',()=>{
  for(const scene of SCENES){
    const c=new InfiniteCamera(scene.center,scene.scale,scene.angle,dynamics(scene.type,scene.c));
    for(let i=0;i<7000;i++){const before=c.logZoom;c.zoom(.7);assert.ok(c.logZoom>before);assert.ok(c.scale>=c.baseScale/c.model.ratio&&c.scale<=c.baseScale);vectorNear(c.center,[0,0]);}
    assert.ok(c.logZoom/Math.LN10>1000);assert.ok(!c.zoomLabel.includes('Infinity'));
  }
});
test('point under the cursor is preserved by a chart transition',()=>{
  const m=dynamics(0,SCENES[0].c),c=new InfiniteCamera([-.03,.02],.65,.23,m),anchor=[.4,-.3];
  c.scale=c.baseScale/m.ratio+1e-11;
  const before=add(c.center,c.offset(...anchor));c.zoom(.99999999,anchor);
  const after=add(c.center,c.offset(...anchor));
  assert.equal(c.level,1);vectorNear(after,mul(before,m.multiplier),1e-9);
});
test('zooming back restores the original view without a reset',()=>{
  const c=new InfiniteCamera([-.12,.08],.65,.31),initial=c.frame();
  for(let i=0;i<90;i++)c.zoom(.7,[.4,-.3]);
  for(let i=0;i<90;i++)c.zoom(1/.7,[.4,-.3]);
  near(c.scale,initial.scale);vectorNear(c.center,initial.center);near(c.rotation,initial.rotation);
});
test('autopilot has no sideways drift and returns gently from manual panning',()=>{
  const c=new InfiniteCamera();for(let i=0;i<1000;i++)c.fly(1/30);vectorNear(c.center,[0,0]);
  c.pan(.3,.1);const before=magnitude(c.center)/c.scale;for(let i=0;i<120;i++)c.fly(1/30);
  assert.ok(magnitude(c.center)/c.scale<before*.05);
});
test('both 3D distance fields repeat under scaling, rather than changing models',()=>{
  for(const type of [8,9])for(let i=1;i<100;i++){
    const p=[Math.sin(i*1.3)*2.4,Math.cos(i*.7)*2.2,Math.sin(i*.37)*2.6];
    near(spongeDistance(p.map(v=>v*3),type)/3,spongeDistance(p,type),1e-5);
  }
  assert.ok(spongeDistance([0,0,0],8)<=0);near(spongeDistance([0,0,0],9),0);
});
