// One periodic coordinate system for the complete recursive composition.
// Increasing magnification by ratio repeats the entire image, including colour and light.
export const TAU=2*Math.PI;
export const LOOP_STYLES=[
  {ratio:4,spokes:7,twist:1,warp:.32,stretch:-1.8,spin:.12,box:1,seed:[.3,.5]},
  {ratio:5,spokes:4,twist:-1,warp:.25,stretch:-2,spin:.65,box:.9,seed:[-.45,.15]},
  {ratio:4,spokes:3,twist:2,warp:.46,stretch:-1.65,spin:.27,box:1.15,seed:[.55,-.3]},
  {ratio:6,spokes:8,twist:0,warp:.5,stretch:-1.9,spin:.785398,box:.8,seed:[-.7,.4]},
  {ratio:4,spokes:5,twist:-2,warp:.26,stretch:-2.1,spin:.45,box:1,seed:[.6,.1]},
  {ratio:5,spokes:2,twist:1,warp:.36,stretch:-1.55,spin:-.36,box:1.1,seed:[-.25,.7]},
  {ratio:3,spokes:12,twist:1,warp:.2,stretch:-2.3,spin:1,box:.65,seed:[.25,-.6]},
  {ratio:4,spokes:6,twist:-1,warp:.55,stretch:-1.75,spin:-.7,box:1,seed:[.3,.3]},
  {ratio:4,spokes:4,twist:1,warp:.3,stretch:-1.9,spin:.2,box:1,seed:[.15,.35]},
  {ratio:3,spokes:6,twist:0,warp:.2,stretch:-2,spin:.4,box:.9,seed:[.4,.15]}
];
export const fract=x=>x-Math.floor(x);
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function dynamics(type,c=[0,0]){const style=LOOP_STYLES[type];return{...style,type,seed:style.seed.map((n,i)=>n+c[i]*.12)};}
export function loopCoordinates(point,model,phase=0){
  const radius=Math.max(Math.hypot(...point),1e-12),angle=Math.atan2(point[1],point[0]);
  let u=TAU*fract(Math.log(radius)/Math.log(model.ratio)-phase);
  const v=model.spokes*angle+model.twist*u;u+=model.warp*Math.sin(v);
  return[.95*Math.cos(u)+.6*Math.cos(v)+.13*Math.sin(2*v-u),.95*Math.sin(u)+.6*Math.sin(v)+.13*Math.cos(2*u+v)];
}
export function patternMeasure(point,model,detail=220){
  const [px,py]=point,{type,stretch,spin,box,seed}=model,c=Math.cos(spin),s=Math.sin(spin);
  let x=px*.72+seed[0],y=py*.72+seed[1],derivative=1,trap=10,rings=0,weight=1;
  const count=clamp(Math.round(detail/32),5,12);
  for(let i=0;i<count;i++){
    if(type===2||type===5){x=Math.abs(x);y=Math.abs(y)-.42;}
    if(type===3||type===7){x=Math.abs(x);y=Math.abs(y);if(y>x)[x,y]=[y,x];x-=.3;y-=.12;}
    x=2*clamp(x,-box,box)-x;y=2*clamp(y,-box,box)-y;
    const r2=x*x+y*y,fold=clamp(1/Math.max(r2,.04),1,5);x*=fold;y*=fold;derivative*=fold;
    const nx=(c*x-s*y)*stretch+px*.55+seed[0];y=(s*x+c*y)*stretch+py*.55+seed[1];x=nx;
    derivative=derivative*Math.abs(stretch)+1;
    trap=Math.min(trap,Math.abs(x)+.3*Math.abs(y));rings+=Math.exp(-3*Math.abs(r2-.7))*weight;weight*=.7;
  }
  const distance=Math.hypot(x,y)/Math.max(derivative,.001);
  return[-Math.log(Math.max(distance,1e-16))*.052+trap*.17+rings*.045,trap,distance];
}
export function spongeDistance(point,type){
 const q=point.map(v=>Math.abs(v)-1);let d=Math.hypot(...q.map(v=>Math.max(v,0)))+Math.min(Math.max(...q),0),scale=1;
 for(let i=0;i<7;i++){
  const a=point.map(v=>(((v+1)*scale%2+2)%2)-1),t=a.map(v=>type===8?Math.abs(v)-1/3:1/3-Math.abs(v));
  d=Math.max(d,Math.max(Math.min(t[0],t[1]),Math.min(t[0],t[2]),Math.min(t[1],t[2]))/scale);scale*=3;
 }
 return d;
}
