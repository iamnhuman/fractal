// Complex polynomial dynamics, shared by navigation, rendering and numeric checks.
export const add=(a,b)=>[a[0]+b[0],a[1]+b[1]];
export const sub=(a,b)=>[a[0]-b[0],a[1]-b[1]];
export const mul=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
export const div=(a,b)=>{const d=b[0]*b[0]+b[1]*b[1];return[(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];};
export const power=(z,n)=>{let p=[1,0];for(let i=0;i<n;i++)p=mul(p,z);return p;};
export const scale=(z,s)=>[z[0]*s,z[1]*s];
export const magnitude=z=>Math.hypot(...z);
export const DEGREES=[2,2,3,4,5,6,7,8];
export const CHART_STEPS=24;
export function dynamics(type,c){
  if(type>=8)return{type,degree:0,fixed:[0,0],multiplier:[3,0],ratio:3,turn:0};
  const degree=DEGREES[type];let best;
  // Solve a^d+c=a, selecting a repelling fixed point, rather than a point in a basin.
  for(let seed=0;seed<degree*3;seed++){
    const angle=2*Math.PI*(seed+.17)/(degree*3);let a=[1.3*Math.cos(angle),1.3*Math.sin(angle)];
    for(let step=0;step<80;step++){
      const value=add(sub(power(a,degree),a),c),derivative=sub(scale(power(a,degree-1),degree),[1,0]);
      if(magnitude(derivative)<1e-12)break;
      const delta=div(value,derivative);a=sub(a,delta);if(magnitude(delta)<1e-14)break;
    }
    const residual=magnitude(add(sub(power(a,degree),a),c));
    const multiplier=scale(power(a,degree-1),degree),ratio=magnitude(multiplier);
    if(residual<1e-9&&ratio>1.4&&(!best||ratio>best.ratio+1e-9))best={type,degree,fixed:a,multiplier,ratio,turn:Math.atan2(multiplier[1],multiplier[0])};
  }
  if(!best)throw new Error('Не найдена устойчивая точка приближения');
  return best;
}
// (a+delta)^d-a^d, factored to preserve tiny offsets without subtraction cancellation.
export function iterateOffset(delta,model){
  const z=add(model.fixed,delta);let sum=[1,0],aPower=[1,0];
  for(let j=1;j<model.degree;j++){aPower=mul(aPower,model.fixed);sum=add(mul(sum,z),aPower);}
  return mul(delta,sum);
}
export function linearize(q,depth,model){
  const count=Math.min(depth,CHART_STEPS);let delta=div(q,power(model.multiplier,count));
  for(let i=0;i<count;i++)delta=iterateOffset(delta,model);
  return delta;
}
export function escapeValue(q,depth,model,limit=360){
  const count=Math.min(depth,CHART_STEPS);let delta=div(q,power(model.multiplier,count));
  let n=-count;
  for(let i=0;i<count+limit;i++){
    delta=iterateOffset(delta,model);n++;
    const r=magnitude(add(model.fixed,delta));
    if(r>64)return n+depth+1-Math.log(Math.log(r))/Math.log(model.degree);
  }
  return null;
}
export function spongeDistance(point,type){
  let d=type===9?Math.max(-point[0],-point[1],-point[2]):-1e5;
  let cell=6561;
  for(let i=0;i<20;i++){
    const q=point.map(p=>((p/cell+(type===8?1.5:0))%3+3)%3);
    const t=q.map(v=>type===8?Math.abs(v-1.5)-.5:.5-Math.abs(v-1.5));
    d=Math.max(d,Math.max(Math.min(t[0],t[1]),Math.min(t[1],t[2]),Math.min(t[2],t[0]))*cell);
    cell/=3;
  }
  return d;
}
