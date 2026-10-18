// Normalized phase keeps infinite zoom precise. Geometry repeats at ratio R;
// the cycle counter is never used to change a material, light or fractal seed.
export const TAU=2*Math.PI;
export const LOOP_STYLES=[
  {ratio:10,spokes:3,twist:2,warp:.15},
  {ratio:6,spokes:4,twist:-1,warp:.25},
  {ratio:5,spokes:3,twist:2,warp:.32},
  {ratio:6,spokes:8,twist:0,warp:.35},
  {ratio:5,spokes:5,twist:-2,warp:.22},
  {ratio:8,spokes:2,twist:1,warp:.22},
  {ratio:3,spokes:5,twist:0,warp:0},
  {ratio:4,spokes:4,twist:0,warp:0},
  {ratio:4,spokes:6,twist:0,warp:0},
  {ratio:3,spokes:6,twist:0,warp:0}
];
export const fract=x=>x-Math.floor(x);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function dynamics(type,c=[0,0]){return{...LOOP_STYLES[type],type,seed:[...c]};}
export function loopCoordinates(point,model,phase=0){
  const radius=Math.max(Math.hypot(...point),1e-12),angle=Math.atan2(point[1],point[0]);
  let u=TAU*fract(Math.log(radius)/Math.log(model.ratio)-phase);
  const v=model.spokes*angle+model.twist*u;u+=model.warp*Math.sin(v);
  return[.95*Math.cos(u)+.6*Math.cos(v)+.13*Math.sin(2*v-u),.95*Math.sin(u)+.6*Math.sin(v)+.13*Math.cos(2*u+v)];
}
// Scalar references for the Julia and Newton potentials.
export function patternMeasure(point,model,detail=220){
  if(model.type===4){
    let [x,y]=point,steps=0,error=1;
    for(let i=0;i<Math.min(48,Math.floor(detail/8));i++){
      const sx=x*x-y*y,sy=2*x*y,denominator=Math.max(sx*sx+sy*sy,1e-20);
      x=x*2/3+sx/denominator/3;y=y*2/3-sy/denominator/3;steps++;
      const radius=Math.hypot(x,y);if(radius>10000){x*=10000/radius;y*=10000/radius;}
      error=Math.hypot(x*x*x-3*x*y*y-1,3*x*x*y-y*y*y);if(error<.0001)break;
    }
    const smooth=Math.max(0,steps-Math.log(Math.log(clamp(error,1e-12,.999))/Math.log(.0001))/Math.LN2);
    return[smooth*.032+.2,Math.floor(Math.atan2(y,x)/TAU*3+.5),error];
  }
  let [x,y]=point,logDerivative=0,trap=10;const degree=model.type<2||model.type===5?2:model.type+1;
  for(let i=0;i<detail;i++){
    const r=Math.max(Math.hypot(x,y),1e-10),a=Math.atan2(y,x);
    logDerivative+=Math.log(degree)+(degree-1)*Math.log(r);
    const power=r**degree;x=power*Math.cos(a*degree)+model.seed[0];y=power*Math.sin(a*degree)+model.seed[1];
    const radius=Math.hypot(x,y);trap=Math.min(trap,Math.abs(radius-.6));
    if(radius>64)return[(i+2-Math.log(Math.log(radius))/Math.log(degree))*.032+.16,trap,.5*Math.log(radius)*radius*Math.exp(clamp(-logDerivative,-80,20))];
  }
  return[.01+trap*.01,trap,0];
}
const rotate=(x,y,a)=>[Math.cos(a)*x-Math.sin(a)*y,Math.sin(a)*x+Math.cos(a)*y];
const boxDistance=p=>{const q=p.map(v=>Math.abs(v)-1);return Math.hypot(...q.map(v=>Math.max(v,0)))+Math.min(Math.max(...q),0);};
export function spongeDistance(point,type){
 let d=boxDistance(point),scale=1;
 for(let i=0;i<5;i++){
  const a=point.map(v=>(((v+1)*scale%2+2)%2)-1),t=a.map(v=>type===8?Math.abs(v)-1/3:1/3-Math.abs(v));
  d=Math.max(d,Math.max(Math.min(t[0],t[1]),Math.min(t[0],t[2]),Math.min(t[1],t[2]))/scale);scale*=3;
 }
 return d;
}
function bulbDistance(p){
 let z=[...p],dr=1,r=0;
 for(let i=0;i<10;i++){
  r=Math.hypot(...z);if(r>2.8)break;
  const safe=Math.max(r,.00001),theta=Math.acos(clamp(z[2]/safe,-1,1))*8,phi=Math.atan2(z[1],z[0])*8,radius=safe**8;
  dr=8*safe**7*dr+1;z=[radius*Math.sin(theta)*Math.cos(phi)+p[0],radius*Math.sin(theta)*Math.sin(phi)+p[1],radius*Math.cos(theta)+p[2]];
 }
 return .5*Math.log(Math.max(r,.00001))*r/dr;
}
function mandelboxDistance(p){
 let z=[...p],dr=1;
 for(let i=0;i<11;i++){
  z=z.map(v=>2*clamp(v,-1,1)-v);const fold=clamp(1/Math.max(z.reduce((s,v)=>s+v*v,0),.25),1,4);
  z=z.map((v,j)=>v*fold*(-1.75)+p[j]);dr=dr*fold*1.75+1;
 }
 return Math.hypot(...z)/dr;
}
function sculpture(point,type){
 let [x,y,z]=point;[x,z]=rotate(x,z,type===6?.23:-.18);[x,y]=rotate(x,y,type===7?.38:.12);const p=[x,y,z];
 if(type===6)return bulbDistance(p.map(v=>v/.95))*.95;
 if(type===7)return mandelboxDistance(p.map(v=>v/.38))*.38;
 return(spongeDistance(p.map(v=>v/.8),type)-(type===8?.045:.008))*.8;
}
// Three adjacent shells are sufficient: the sculpture's bounding sphere never
// reaches the next omitted shell. Unlike a 2D warp, this is a 3D distance field.
export function volumeDistance(point,model){
 const radius=Math.max(Math.hypot(...point),1e-9),scale=model.ratio**Math.floor(Math.log(radius)/Math.log(model.ratio));let distance=radius*100;
 for(const size of [scale/model.ratio,scale,scale*model.ratio]){
  let [x,y,z]=point.map(v=>v/size);const sides=model.type===6?5:model.type===7?4:6,sector=TAU/sides;
  [x,y]=rotate(x,y,-Math.floor(Math.atan2(y,x)/sector+.5)*sector);const q=[x-1.48,y,z-1.3],bound=Math.hypot(...q)-1.5;
  distance=Math.min(distance,(bound>.14?bound:sculpture(q,model.type))*size);
 }
 return distance;
}
