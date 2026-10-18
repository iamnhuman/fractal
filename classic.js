// Original Julia families, expressed in a linearizing coordinate around a
// repelling period-four orbit. A homogeneous logarithmic twist turns the
// complex multiplier into a real scale period without distorting the curls
// into a trigonometric tile. The same branches exist at every depth.
const multiply=(a,b)=>[a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]];
const add=(a,b)=>a.map((v,i)=>v+b[i]);
const subtract=(a,b)=>a.map((v,i)=>v-b[i]);
const divide=(a,b)=>{const d=b[0]**2+b[1]**2;return[(a[0]*b[0]+a[1]*b[1])/d,(a[1]*b[0]-a[0]*b[1])/d];};
const rotate=(p,a)=>multiply(p,[Math.cos(a),Math.sin(a)]);
const STYLES=[
 {root:[.17501626,.60116705],scale:.5,fold:1},
 {root:[.14100676,.57524168],scale:.2,fold:1},
 {root:[.13416616,.62348155],scale:.35,fold:2},
 {root:[-.65771638,-.19527591],scale:.1,fold:2}
];
export function classicDynamics(type,c){
 const style=STYLES[type],period=4;let root=[...style.root];
 for(let iteration=0;iteration<12;iteration++){
  let z=root,derivative=[1,0];
  for(let i=0;i<period;i++){derivative=multiply(z,derivative).map(v=>2*v);z=add(multiply(z,z),c);}
  root=subtract(root,divide(subtract(z,root),subtract(derivative,[1,0])));
 }
 let z=root,cycle=[],multiplier=[1,0];
 for(let i=0;i<period;i++){cycle.push(z.map(Math.fround));z=add(multiply(z,z),c);}
 // Use precisely the coefficients sent to the GPU for the chart multiplier.
 for(const point of cycle)multiplier=multiply(multiplier,point.map(v=>2*v));
 return{type,seed:[...c],classic:true,period,cycle,ratio:Math.hypot(...multiplier),argument:Math.atan2(multiplier[1],multiplier[0]),charts:10,chartScale:style.scale,fold:style.fold,spokes:1,twist:0,warp:0};
}
export function classicPoint(point,model,phase=0){
 let p=[...point];const logRadius=Math.log(Math.max(Math.hypot(...p),1e-12));
 if(model.fold>1.5)p[0]=Math.abs(p[0]);if(model.fold>.5)p[1]=-Math.abs(p[1]);
 const logRatio=Math.log(model.ratio),angle=model.argument/logRatio*logRadius-(model.charts+phase)*model.argument;
 return rotate(p,angle).map(v=>v*model.chartScale*Math.exp(-(model.charts+phase)*logRatio));
}
const oval=(p,r)=>Math.abs(Math.hypot(p[0]/r[0],p[1]/r[1])-1)*Math.min(...r);
function emblem(point){const p=point.map(v=>v*.94);return Math.min(oval(p,[.85,.56]),oval(p,[.26,.56]),oval([p[0],p[1]-.21],[.64,.24]));}
export function classicMeasure(point,model,phase=0,detail=220){
 let delta=classicPoint(point,model,phase),stage=0,count=0,z=add(model.cycle[0],delta),escaped=false;const tail=[];
 for(let i=0;i<detail+model.charts*model.period;i++){
  delta=multiply(add(model.cycle[stage].map(v=>2*v),delta),delta);stage=(stage+1)%model.period;
  z=add(model.cycle[stage],delta);tail.push(z);if(tail.length>8)tail.shift();count++;
  if(z[0]*z[0]+z[1]*z[1]>256){escaped=true;break;}
 }
 const radius=Math.max(Math.hypot(...point),1e-12),r2=z[0]*z[0]+z[1]*z[1];
 const n=count-model.charts*model.period+(Math.log(radius)/Math.log(model.ratio)-phase)*model.period;
 const smooth=n+1-Math.log2(Math.max(Math.log2(Math.max(r2,1.001))*.5,.001));
 return[escaped?smooth*.022:.01,Math.min(...tail.map(emblem)),escaped?1:0];
}
export const CLASSIC_SHADER=`
uniform vec4 u_chart;
uniform vec2 u_c0,u_c1,u_c2,u_c3;
vec2 product(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 chartBase(int stage){if(stage==0)return u_c0;if(stage==1)return u_c1;if(stage==2)return u_c2;return u_c3;}
float orbitMark(vec2 p){return emblem(p*.94);}
vec3 classicField(vec2 original){
  vec2 p=original,signs=vec2(1.);float radius=max(length(p),1.e-12),logRadius=log(radius),period=4.;
  if(u_chart.z>1.5){signs.x=p.x<0.?-1.:1.;p.x=abs(p.x);}
  if(u_chart.z>.5){signs.y=p.y>0.?-1.:1.;p.y=-abs(p.y);}
  float shear=u_chart.w/u_loop.x,twist=shear*logRadius;
  float angle=twist-(u_chart.x+u_zoomPhase)*u_chart.w;
  vec2 linear=vec2(cos(angle),sin(angle));
  vec2 delta=product(p,linear)*u_chart.y*exp(-(u_chart.x+u_zoomPhase)*u_loop.x);
  vec2 derivative=linear,z=chartBase(0)+delta;
  float logDerivative=log(u_chart.y)-(u_chart.x+u_zoomPhase)*u_loop.x,count=0.;int stage=0;bool escaped=false;
  vec2 edgeOrbit=z,edgeDerivative=derivative;float edgeCount=0.;bool edgeCaptured=false;
  vec4 tail0=vec4(0.),tail1=vec4(0.),tail2=vec4(0.),tail3=vec4(0.);
  for(int i=0;i<512;i++){
    if(i>=u_iterations)break;
    vec2 a=chartBase(stage);derivative=product(derivative,2.*(a+delta));
    if(max(abs(derivative.x),abs(derivative.y))>1.e10){derivative*=1.e-10;logDerivative+=log(1.e10);}
    delta=product(2.*a+delta,delta);stage++;if(stage>=4)stage=0;
    z=chartBase(stage)+delta;count+=1.;
    if(!edgeCaptured&&logDerivative+log(max(length(derivative),1.e-20))+log(2./u_resolution.y)>log(.08)){
      edgeOrbit=z;edgeDerivative=derivative;edgeCount=count;edgeCaptured=true;
    }
    tail0=vec4(tail0.zw,tail1.xy);tail1=vec4(tail1.zw,tail2.xy);tail2=vec4(tail2.zw,tail3.xy);tail3=vec4(tail3.zw,z);
    if(dot(z,z)>256.){escaped=true;break;}
  }
  vec4 traps0=vec4(orbitMark(tail0.xy),orbitMark(tail0.zw),orbitMark(tail1.xy),orbitMark(tail1.zw));
  vec4 traps1=vec4(orbitMark(tail2.xy),orbitMark(tail2.zw),orbitMark(tail3.xy),orbitMark(tail3.zw));
  float trap=min(min(min(traps0.x,traps0.y),min(traps0.z,traps0.w)),min(min(traps1.x,traps1.y),min(traps1.z,traps1.w)));
  float n=count-u_chart.x*period+(logRadius/u_loop.x-u_zoomPhase)*period;
  float r2=dot(z,z),smoothN=n+1.-log2(max(log2(max(r2,1.001))*.5,.001));
  vec2 d=derivative/max(length(derivative),1.e-20),gradient=product(z,vec2(d.x,-d.y));
  gradient+=shear*dot(vec2(-p.y,p.x),gradient)/max(dot(p,p),1.e-24)*p;
  vec2 normal=normalize(rotate(gradient*signs,u_rotation)+vec2(.000001));
  float light=.66+.34*dot(normal,normalize(vec2(-.6,1.)));
  float orbit=exp(-trap*32.)*u_emblem;
  vec3 col=palette(smoothN*.022+u_phase+orbit*.13);
  float shine=pow(max(dot(normal,normalize(vec2(-.7,.9))),0.),14.);
  col*=mix(1.,.28+light*.8,u_relief);col+=vec3(1.,.92,.85)*shine*u_relief*.17;
  float line=exp(-trap*150.);col=mix(col,mix(u_p2,u_p1,.32),line*u_emblem*.72);
  // Integrate unresolved filaments into a stable edge. More iterations must
  // reveal curls when they reach a pixel, rather than turn them into flicker.
  float inverseSlope=exp(clamp(-logDerivative-log(max(length(derivative),1.e-20)),-80.,20.))/sqrt(1.+shear*shear);
  float pixel=2./u_resolution.y;
  vec2 edgeD=edgeDerivative/max(length(edgeDerivative),1.e-20),edgeG=product(edgeOrbit,vec2(edgeD.x,-edgeD.y));
  edgeG+=shear*dot(vec2(-p.y,p.x),edgeG)/max(dot(p,p),1.e-24)*p;
  vec2 edgeNormal=normalize(rotate(edgeG*signs,u_rotation)+vec2(.000001));
  float edgeLight=.65+.35*dot(edgeNormal,normalize(vec2(-.6,1.)));
  float edgeN=edgeCount-u_chart.x*period+(logRadius/u_loop.x-u_zoomPhase)*period;
  vec3 edge=palette(edgeN*.022+u_phase+exp(-orbitMark(edgeOrbit)*32.)*u_emblem*.13);
  edge*=mix(1.,.28+edgeLight*.8,u_relief);
  if(!escaped)return edgeCaptured?edge:u_p0*.65;
  float distance=.5*log(length(z))*length(z)*inverseSlope,resolved=smoothstep(pixel*.08,pixel*.7,distance);
  return mix(edge,col,resolved);
}
vec3 field2D(vec2 p){return classicField(p);}
void main(){
  vec3 col=vec3(0.);float count=0.;
  for(int sample=0;sample<4;sample++){
    if(sample>=u_samples)break;
    vec2 offset=vec2(0.);
    if(u_samples==2)offset=sample==0?vec2(-.25,.25):vec2(.25,-.25);
    if(u_samples==4)offset=vec2(mod(float(sample),2.)-.5,floor(float(sample)/2.)-.5)*.5;
    col+=classicField(screenPoint(offset));count+=1.;
  }
  col=col/count*(1.-.16*pow(length(v_uv-.5)*1.3,2.));
  gl_FragColor=vec4(finish(col),1.);
}
`;
