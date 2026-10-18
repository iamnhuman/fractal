import {CLASSIC_SHADER} from './classic.js?v=8';
import {InfiniteCamera} from './navigation.js?v=8';
import {dynamics} from './fractal-math.js?v=8';
export const PALETTES = [
  {name:'CRIMSON',colors:['#130d10','#b8172a','#eee7dc','#958677','#f7f3ed'],swatches:['#e32a43','#f0e9df','#1a1618']},
  {name:'REDLINE',colors:['#080b0e','#d91b31','#f2f0e9','#474a50','#ed1f38'],swatches:['#ed203a','#e7e7e5','#35373b']},
  {name:'DESERT',colors:['#23180e','#8b5733','#e0c49a','#6b482a','#faf0da'],swatches:['#b17b49','#e1c49b','#58422b']},
  {name:'SEA GLASS',colors:['#06191c','#127a7b','#cce4d4','#4c9298','#f0f0de'],swatches:['#218d8c','#d1e7d8','#153c40']},
  {name:'JADE',colors:['#061a16','#27785a','#d6ee9a','#42614c','#f3f7d0'],swatches:['#519b6b','#d3e59c','#16392e']},
  {name:'COPPER',colors:['#17111a','#9d5638','#ebc7a5','#514457','#fff0db'],swatches:['#bd7a50','#eac5a3','#382a39']},
  {name:'ELECTRIC',colors:['#050c23','#164cca','#75d5ff','#5b20a2','#e7edff'],swatches:['#3772ef','#86d8ff','#36177b']},
  {name:'PRISM',colors:['#151425','#c45181','#eac27c','#398d91','#e5e7ff'],swatches:['#ce7195','#e7bd76','#58a2a2']},
  {name:'PEARL',colors:['#10151c','#547889','#d4e2dd','#79778c','#fff4df'],swatches:['#b8d3d2','#77788a','#e6d8c7']},
  {name:'GOLD',colors:['#11100c','#7e662d','#dace9b','#446a64','#fff4d4'],swatches:['#b5a16a','#e4d6a8','#41675d']}
];
export const is3D=type=>type>=6;
export const GEOMETRIES=['Julia · кружево','Julia · двойные ветви','Julia · пустынные перья','Julia · стеклянные кораллы','Ньютон · переплетение','Феникс · медные перья','Мандельбульб · 3D','Мандельбокс · 3D','Вичек · 3D','Менгер · 3D'];
export const SCENES=[
  {name:'Crimson Lace',description:'Кружевные спирали и вложенные раковины Julia',palette:0,c:[-.74543,.11301],center:[0,0],scale:1,type:0,emblem:70,relief:65,angle:-.15},
  {name:'Redline',description:'Двойные закрученные ветви и глубокие завитки Julia',palette:1,c:[-.8,.156],center:[0,0],scale:1,type:1,emblem:50,relief:65,angle:.3},
  {name:'Desert Bloom',description:'Ветвящиеся песочные спирали Julia',palette:2,c:[-.7269,.1889],center:[0,0],scale:1,type:2,emblem:55,relief:65,angle:-.4},
  {name:'Glass Garden',description:'Переплетённые стеклянные кораллы Julia',palette:3,c:[-.4,.6],center:[0,0],scale:1,type:3,emblem:80,relief:65,angle:.1},
  {name:'Jade Knot',description:'Нефритовые переплетения фрактала Ньютона',palette:4,c:[.42,.1],center:[0,0],scale:1,type:4,emblem:65,angle:-.35},
  {name:'Copper Feather',description:'Рекурсивные перья фрактала Феникса',palette:5,c:[.56667,-.5],center:[0,0],scale:1,type:5,emblem:40,angle:.2},
  {name:'Electric Bloom',description:'Скульптурный мандельбульб · 3D',palette:6,c:[-.61,.08],center:[0,0],scale:1,type:6,emblem:50,angle:-.2},
  {name:'Prism Roots',description:'Объёмная архитектура мандельбокса · 3D',palette:7,c:[.12,.63],center:[0,0],scale:1,type:7,emblem:35,angle:.1},
  {name:'Pearl Lattice',description:'Объёмный фрактал Вичека',palette:8,c:[0,0],center:[0,0],scale:1,type:8,emblem:30,angle:0},
  {name:'Golden Labyrinth',description:'Самоподобная губка Менгера',palette:9,c:[0,0],center:[0,0],scale:1,type:9,emblem:35,angle:0}
];
export const VERTEX=`attribute vec2 a_position;varying vec2 v_uv;void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;
const COMMON=`precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution,u_seed;
uniform vec4 u_loop;
uniform float u_zoomPhase,u_rotation,u_emblem,u_relief,u_phase;
uniform int u_iterations,u_type,u_samples;
uniform vec3 u_p0,u_p1,u_p2,u_p3,u_p4;
const float PI=3.141592653589793;
const float TAU=6.283185307179586;
vec2 rotate(vec2 p,float a){float c=cos(a),s=sin(a);return vec2(c*p.x-s*p.y,s*p.x+c*p.y);}
float ellipse(vec2 p,vec2 r){return abs(length(p/r)-1.)*min(r.x,r.y);}
float emblem(vec2 p){return min(ellipse(p,vec2(.85,.56)),min(ellipse(p,vec2(.26,.56)),ellipse(p-vec2(0.,.21),vec2(.64,.24))));}
vec3 palette(float t){t=fract(t)*5.;if(t<1.)return mix(u_p0,u_p1,smoothstep(0.,1.,t));if(t<2.)return mix(u_p1,u_p2,smoothstep(0.,1.,t-1.));if(t<3.)return mix(u_p2,u_p3,smoothstep(0.,1.,t-2.));if(t<4.)return mix(u_p3,u_p4,smoothstep(0.,1.,t-3.));return mix(u_p4,u_p0,smoothstep(0.,1.,t-4.));}
vec2 screenPoint(vec2 offset){return rotate(((v_uv+offset/u_resolution)*2.-1.)*vec2(u_resolution.x/u_resolution.y,1.),-u_rotation);}
// All radial and angular boundaries close analytically, without cross-fading images.
vec2 loopCoordinates(vec2 p){
  float radius=max(length(p),1.e-12),angle=atan(p.y,p.x);
  float u=TAU*fract(log(radius)/u_loop.x-u_zoomPhase);
  float v=u_loop.y*angle+u_loop.z*u;u+=u_loop.w*sin(v);
  return vec2(.95*cos(u)+.6*cos(v)+.13*sin(2.*v-u),.95*sin(u)+.6*sin(v)+.13*cos(2.*u+v));
}
vec3 finish(vec3 c){return pow(max(c,vec3(0.)),vec3(.94));}
`;
const TWO_D=`
vec2 multiply(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 divide(vec2 a,vec2 b){return multiply(a,vec2(b.x,-b.y))/max(dot(b,b),1.e-20);}
vec3 newton(vec2 p){
  vec2 z=p,derivative=vec2(1.,0.),normal=vec2(1.,0.);float steps=0.,error=1.;
  for(int i=0;i<48;i++){
    if(i>=u_iterations/8)break;
    vec2 square=multiply(z,z),cube=multiply(square,z);
    vec2 gradient=multiply(square,derivative);
    normal=normalize(multiply(cube-vec2(1.,0.),vec2(gradient.x,-gradient.y))+vec2(1.e-20,0.));
    vec2 slope=(vec2(1.,0.)-divide(vec2(1.,0.),cube))*(2./3.);
    derivative=normalize(multiply(derivative,slope)+vec2(1.e-20,0.));
    z=z*(2./3.)+divide(vec2(1.,0.),square)/3.;
    float radius=length(z);if(radius>10000.)z*=10000./radius;
    error=length(multiply(multiply(z,z),z)-vec2(1.,0.));steps+=1.;
    if(error<.0001)break;
  }
  float smoothSteps=max(0.,steps-log(log(clamp(error,1.e-12,.999))/log(.0001))/log(2.));
  float basin=floor(atan(z.y,z.x)/TAU*3.+.5);
  float light=.72+.28*dot(normal,normalize(vec2(-.6,1.)));
  vec3 col=palette(smoothSteps*.032+basin*.09+u_phase+.2);
  col*=mix(1.,.48+light*.65,u_relief);
  col+=u_p4*pow(light,22.)*u_relief*.1;
  return col;
}
vec3 julia(vec2 p,float footprint){
  vec2 z=p,derivative=vec2(1.,0.),previous=vec2(0.),previousDerivative=vec2(0.);float logDerivative=0.,trap=10.,iteration=0.;bool escaped=false;
  int degree=u_type<2||u_type==5?2:u_type+1;
  for(int i=0;i<360;i++){
    if(i>=u_iterations)break;
    float r=max(length(z),1.e-10),a=atan(z.y,z.x),d=float(degree);
    if(u_type==5){
      vec2 nextDerivative=2.*multiply(z,derivative)+u_seed.y*previousDerivative;
      vec2 next=multiply(z,z)+vec2(u_seed.x,0.)+u_seed.y*previous;
      previous=z;previousDerivative=derivative;derivative=nextDerivative;z=next;
      if(length(derivative)>1.e10){derivative*=1.e-10;previousDerivative*=1.e-10;logDerivative+=log(1.e10);}
    }else{
      vec2 direction=degree==2?z/r:vec2(cos(a*(d-1.)),sin(a*(d-1.)));
      derivative=multiply(derivative,direction);logDerivative+=log(d)+(d-1.)*log(r);
      z=(degree==2?multiply(z,z):pow(r,d)*vec2(cos(a*d),sin(a*d)))+u_seed;
    }
    iteration+=1.;trap=min(trap,abs(length(z)-.6));
    if(dot(z,z)>4096.){escaped=true;break;}
  }
  vec3 edge=mix(u_p2,u_p4,.25)*.65;
  if(!escaped)return mix(u_p0*.65,u_p3*.22,.2+.3*exp(-8.*trap));
  float radius=length(z),smoothN=iteration+1.-log(log(radius))/log(float(degree));
  float derivativeLength=max(length(derivative),1.e-20);vec2 direction=derivative/derivativeLength;
  vec2 normal=multiply(z/radius,vec2(direction.x,-direction.y));
  float light=.62+.38*dot(normal,normalize(vec2(-.6,1.)));
  float distance=.5*log(radius)*radius*exp(clamp(-logDerivative-log(derivativeLength),-80.,20.));
  // Details smaller than a pixel become a smooth filament, never random speckles.
  float resolved=smoothstep(footprint*.015,footprint*.45,distance);
  float contour=1.-exp(-pow(max(distance,0.)*32.,.45));
  vec3 col=palette(smoothN*.032+u_phase+.16);
  col*=mix(1.,.34+light*.85,u_relief)*(.55+.45*contour);
  col+=u_p4*pow(max(light,0.),22.)*u_relief*.13*contour;
  vec2 orbit=vec2(atan(z.y,z.x)/PI,fract(log(log(radius))/log(float(degree)))*1.4-.7);
  float ink=(1.-smoothstep(.008,.025,emblem(orbit)))*u_emblem*resolved*smoothstep(14.,28.,smoothN);
  col=mix(col,u_p2,ink*.3);
  return mix(edge,col,resolved);
}
vec3 field2D(vec2 screen){
  vec2 q=loopCoordinates(screen);float pixel=2./u_resolution.y;
  if(u_type==4)return newton(q);
  float footprint=max(length(loopCoordinates(screen+vec2(pixel,0.))-q),length(loopCoordinates(screen+vec2(0.,pixel))-q));
  return julia(q,max(footprint,.00001));
}
void main(){
  vec3 col=vec3(0.);float count=0.;
  for(int sample=0;sample<4;sample++){
    if(sample>=u_samples)break;
    vec2 offset=vec2(0.);
    if(u_samples==2)offset=sample==0?vec2(-.25,.25):vec2(.25,-.25);
    if(u_samples==4)offset=vec2(mod(float(sample),2.)-.5,floor(float(sample)/2.)-.5)*.5;
    col+=field2D(screenPoint(offset));count+=1.;
  }
  gl_FragColor=vec4(finish(col/count),1.);
}
`;
const THREE_D=`
float box(vec3 p,vec3 size){vec3 q=abs(p)-size;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.);}
float bulb(vec3 p){
  vec3 z=p;float dr=1.,r=0.;
  for(int i=0;i<10;i++){
    r=length(z);if(r>2.8)break;
    float power=u_type==2?6.:8.;
    float safe=max(r,.00001),theta=acos(clamp(z.z/safe,-1.,1.)),phi=atan(z.y,z.x);
    dr=power*pow(safe,power-1.)*dr+1.;float radius=pow(safe,power);theta*=power;phi*=power;
    z=radius*vec3(sin(theta)*cos(phi),sin(theta)*sin(phi),cos(theta))+p;
  }
  return .5*log(max(r,.00001))*r/dr;
}
float mandelbox(vec3 p){
  vec3 z=p;float dr=1.;
  for(int i=0;i<11;i++){
    z=2.*clamp(z,-1.,1.)-z;float r2=dot(z,z),fold=clamp(1./max(r2,.25),1.,4.);
    z=z*fold*(-1.75)+p;dr=dr*fold*1.75+1.;
  }
  return length(z)/dr;
}
float klein(vec3 p){
  vec3 z=p*1.7;float derivative=1.;
  for(int i=0;i<9;i++){
    z=2.*clamp(z,-vec3(.85,.7,1.),vec3(.85,.7,1.))-z;
    float fold=max(1.08/max(dot(z,z),.0001),1.);z*=fold;derivative*=fold;
    z.xy=rotate(z.xy,.12);
  }
  return (length(z.xy)-.46)/derivative/1.7;
}
float apollonian(vec3 p){
  vec3 z=p*1.55;float derivative=1.;
  for(int i=0;i<8;i++){
    z=2.*fract(z*.5+.5)-1.;float fold=1.45/max(dot(z,z),.08);
    z*=fold;derivative*=fold;
  }
  return (.28*abs(z.z)-.018)/derivative/1.55;
}
float quaternion(vec3 p){
  vec4 z=vec4(p.y,p.z,0.,p.x);float derivative=1.,r=length(z);
  for(int i=0;i<13;i++){
    r=length(z);if(r>4.)break;
    derivative=max(2.*r*derivative,.00001);
    z=vec4(2.*z.w*z.xyz,z.w*z.w-dot(z.xyz,z.xyz))+vec4(.6,.45,0.,.3);
  }
  return .5*r*log(max(r,.00001))/derivative;
}
float sponge(vec3 p){
  float d=box(p,vec3(1.)),scale=1.;
  for(int i=0;i<5;i++){
    vec3 a=mod((p+1.)*scale,2.)-1.,t=u_type==8?abs(a)-1./3.:1./3.-abs(a);
    d=max(d,max(min(t.x,t.y),max(min(t.x,t.z),min(t.y,t.z)))/scale);scale*=3.;
  }
  return d;
}
float sculpture(vec3 p){
  p.xz=rotate(p.xz,u_type==6?.23:-.18);p.xy=rotate(p.xy,u_type==7?.38:.12);
  float d;
  if(u_type==0)d=klein(p);
  else if(u_type==1)d=apollonian(p);
  else if(u_type==2)d=bulb(p/1.0);
  else if(u_type==3)d=quaternion(p/.92)*.92;
  else if(u_type==6)d=bulb(p/.95)*.95;
  else if(u_type==7)d=mandelbox(p/.38)*.38;
  else d=(sponge(p/.8)-(u_type==8?.045:.008))*.8;
  return max(d,length(p)-1.28);
}
float sectorCount(){return u_type==0?3.:u_type==1?5.:u_type==2?4.:u_type==3?3.:u_type==6?5.:u_type==7?4.:6.;}
vec3 localPoint(vec3 p,float size){
  vec3 q=p/size;float sector=TAU/sectorCount();
  q.xy=rotate(q.xy,-floor(atan(q.y,q.x)/sector+.5)*sector);
  q.y=abs(q.y);
  return q-vec3(1.48,0.,1.3);
}
// Real 3D geometry at every scale. Neighbouring shells coexist in the world;
// scaling the camera by R reveals the smaller copy already inside the corridor.
float distanceField(vec3 p){
  float radius=max(length(p),1.e-9),scale=exp(floor(log(radius)/u_loop.x)*u_loop.x),ratio=exp(u_loop.x),d=radius*100.;
  for(int layer=0;layer<3;layer++){
    float size=scale/ratio;if(layer==1)size=scale;if(layer==2)size=scale*ratio;
    vec3 q=localPoint(p,size);
    float bound=length(q)-1.5;
    float local=bound>.14?bound:sculpture(q);
    d=min(d,local*size);
  }
  return d;
}
// The material coordinates belong to the winning recursive cell, so every
// engraved ring, reflection and checker repeats together with its geometry.
vec3 surfaceCoordinate(vec3 p){
  float radius=max(length(p),1.e-9),scale=exp(floor(log(radius)/u_loop.x)*u_loop.x),ratio=exp(u_loop.x),best=radius*100.;vec3 coordinate=p;
  for(int layer=0;layer<3;layer++){
    float size=scale/ratio;if(layer==1)size=scale;if(layer==2)size=scale*ratio;
    vec3 q=localPoint(p,size);float d=sculpture(q)*size;
    if(d<best){best=d;coordinate=q;}
  }
  coordinate.xz=rotate(coordinate.xz,u_type==6?.23:-.18);coordinate.xy=rotate(coordinate.xy,u_type==7?.38:.12);
  return coordinate;
}
vec3 engraving(vec2 uv){
  float line=0.,height=0.,inlay=0.,weight=1.;
  for(int level=0;level<3;level++){
    vec2 cell=fract(uv)-.5;float r=length(cell),angle=atan(cell.y,cell.x);
    float gear=.35+.014*cos(angle*24.);
    float ring=min(abs(r-gear),min(abs(r-.27),abs(r-.115)));
    float ticks=abs(sin(angle*12.))*r;
    float tickMask=(1.-smoothstep(.006,.014,ticks))*smoothstep(.19,.23,r)*(1.-smoothstep(.28,.31,r));
    float stroke=1.-smoothstep(.004,.012,ring);
    float halo=1.-smoothstep(.008,.025,ring);
    line=max(line,stroke*weight);height+=halo*weight+tickMask*.5*weight;
    inlay=max(inlay,(1.-smoothstep(.045,.075,r))*weight);
    // A few three-oval forms are part of the smallest medallions.
    if(level==1){float oval=1.-smoothstep(.008,.02,emblem(cell*2.2));line=max(line,oval*u_emblem*.55);}
    uv=uv*3.+vec2(.17,.31);weight*=.48;
  }
  return vec3(line,height,inlay);
}
vec2 materialUV(vec3 q){return vec2(atan(q.z,q.x)/TAU*8.,q.y*3.2);}
vec3 studio(vec3 direction){
  float horizon=.5+.5*direction.y;
  vec3 c=mix(u_p0*.08,u_p4*.35,pow(horizon,2.5));
  float window=pow(max(dot(direction,normalize(vec3(-.7,.8,1.))),0.),12.);
  float strip=pow(max(dot(direction,normalize(vec3(.9,.25,-.3))),0.),35.);
  float lower=pow(max(dot(direction,normalize(vec3(-.25,-.6,.8))),0.),12.);
  float panel=exp(-pow((direction.x+.3)/.17,2.))*smoothstep(0.,.4,direction.z);
  return c+u_p4*(window*1.8+panel*1.2)+mix(u_p2,u_p4,.7)*strip*1.4+u_p2*lower*.2;
}
vec3 surfaceNormal(vec3 p,float e){
  vec2 k=vec2(1.,-1.);
  return normalize(k.xyy*distanceField(p+k.xyy*e)+k.yyx*distanceField(p+k.yyx*e)+k.yxy*distanceField(p+k.yxy*e)+k.xxx*distanceField(p+k.xxx*e));
}
float ambientOcclusion(vec3 p,vec3 n,float size){
  float occlusion=0.,weight=1.;
  for(int i=1;i<=4;i++){float h=size*.025*float(i);occlusion+=(h-distanceField(p+n*h))*weight;weight*=.55;}
  return clamp(1.-occlusion*6./size,.16,1.);
}
float shadow(vec3 p,vec3 light,float size){
  float result=1.,t=size*.008;
  for(int i=0;i<20;i++){
    float d=distanceField(p+light*t);result=min(result,12.*d/t);t+=clamp(d,size*.006,size*.15);
    if(result<.05||t>size*1.6)break;
  }
  return clamp(result,.1,1.);
}
vec3 field3D(vec2 screen){
  float cameraScale=exp(-u_zoomPhase*u_loop.x);
  vec3 view=u_type==0?vec3(.32,.14,4.8):u_type==1?vec3(-.28,.2,4.8):u_type==2?vec3(.25,-.18,4.8):u_type==3?vec3(.3,.15,4.8):vec3(.4,.2,4.8);
  vec3 ro=view*cameraScale;
  vec3 forward=normalize(-ro),right=normalize(cross(forward,vec3(0.,1.,0.))),up=cross(right,forward);
  vec3 rd=normalize(forward*1.8+right*screen.x+up*screen.y);
  float t=0.,epsilon=cameraScale*.00035;bool hit=false;
  for(int i=0;i<160;i++){
    vec3 point=ro+rd*t;float d=distanceField(point);
    epsilon=max(cameraScale*.00012,t/u_resolution.y*.3)*mix(1.3,.7,(float(u_iterations)-80.)/280.);
    if(d<epsilon){hit=true;break;}
    t+=max(d*.72,epsilon*.3);if(t>cameraScale*10.)break;
  }
  vec3 background=mix(u_p0*.65,u_p3*.16,clamp(.5+.3*screen.y,0.,1.));
  if(!hit)return background;
  vec3 p=ro+rd*t,n=surfaceNormal(p,max(epsilon*.8,t/u_resolution.y*.65)),light=normalize(vec3(-.6,.8,1.2));
  vec3 q=surfaceCoordinate(p);vec2 uv=materialUV(q);vec3 pattern=engraving(uv);
  float etched=u_type==0||u_type==7||u_type==9?1.:u_type==1?.5:.18;
  float h=pattern.y,delta=.002;
  float dx=clamp((engraving(uv+vec2(delta,0.)).y-h)/delta,-20.,20.);
  float dy=clamp((engraving(uv+vec2(0.,delta)).y-h)/delta,-20.,20.);
  vec3 tangent=vec3(-q.z,0.,q.x);tangent-=n*dot(tangent,n);tangent=normalize(tangent+vec3(.000001));
  vec3 bitangent=normalize(cross(n,tangent));
  n=normalize(n-(tangent*dx+bitangent*dy)*.004*etched*u_relief);
  float size=max(length(p),cameraScale*.002),ao=ambientOcclusion(p,n,size),shade=shadow(p+n*epsilon*3.,light,size);
  float diffuse=max(dot(n,light),0.)*shade,hemisphere=.5+.5*n.y;
  float cycle=log(max(length(p),1.e-8))/u_loop.x;
  float tone=.67+.12*sin(cycle*TAU+u_phase*TAU);
  vec3 material=mix(mix(u_p1,u_p2,tone),u_p4,.42);
  material=mix(material,mix(u_p0,u_p3,.35)*.7,pattern.x*etched*.62);
  material=mix(material,u_p4*.85,pattern.z*etched*.24);
  if(u_type==8){float checker=mod(floor(q.x*9.)+floor(q.y*9.)+floor(q.z*9.),2.);material=mix(u_p0*.8,u_p4*.95,checker);}
  float metal=u_type==1?.35:u_type==8?.5:.82;
  vec3 reflected=studio(reflect(rd,n));
  float nv=max(dot(n,-rd),0.),fresnel=.3+.7*pow(1.-nv,4.);
  float specular=pow(max(dot(n,normalize(light-rd)),0.),u_type==1?36.:90.)*shade;
  float fill=max(dot(n,-rd),0.);
  vec3 col=material*(.12+.12*hemisphere+.85*diffuse+.1*fill)*ao;
  col+=reflected*mix(vec3(1.),material*.5+vec3(.5),metal)*(.42+fresnel*.55)*(.15+.85*ao);
  col+=u_p4*specular*.9;
  col+=material*pow(1.-nv,3.)*.12;
  // Deep incisions carry warm/cool inlay, not a flat overlay over the image.
  col=mix(col,col*.65+u_p1*.1,pattern.x*etched*.25);
  col=mix(material*.7,col,.35+.65*u_relief);
  return mix(col,background,1.-exp(-t/cameraScale*.025));

}
void main(){
  vec3 col=vec3(0.);float count=0.;
  for(int sample=0;sample<4;sample++){
    if(sample>=u_samples)break;
    vec2 offset=vec2(0.);
    if(u_samples==2)offset=sample==0?vec2(-.25,.25):vec2(.25,-.25);
    if(u_samples==4)offset=vec2(mod(float(sample),2.)-.5,floor(float(sample)/2.)-.5)*.5;
    col+=field3D(screenPoint(offset));count+=1.;
  }
  gl_FragColor=vec4(pow(1.-exp(-max(col/count,vec3(0.))*1.6),vec3(.88)),1.);
}
`;
export const fragmentFor=type=>COMMON+(type<4?CLASSIC_SHADER:is3D(type)?THREE_D:TWO_D).replaceAll('u_type',String(type));
export const FRAGMENT=fragmentFor(0);
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
export function renderUniforms(settings,camera,width,height){
  const {phase,rotation,model:m}=camera.frame();
  const u={u_resolution:[width,height],u_seed:settings.c,u_loop:[Math.log(m.ratio),m.spokes,m.twist,m.warp],u_zoomPhase:phase,u_rotation:rotation,u_emblem:settings.emblem/100,u_relief:settings.relief/100,u_phase:settings.phase||0,u_iterations:settings.detail+(m.classic?m.charts*m.period:0),u_type:settings.type,u_samples:settings.samples||2};
  if(m.classic){u.u_chart=[m.charts,m.chartScale,m.fold,m.argument];m.cycle.forEach((point,i)=>u['u_c'+i]=point);}
  PALETTES[settings.palette].colors.forEach((color,i)=>u['u_p'+i]=rgb(color));return u;
}
export class FractalRenderer{
  constructor(canvas){
    this.canvas=canvas;this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance'});
    if(!this.gl)throw new Error('WebGL недоступен');this.programs=new Map();
    const gl=this.gl,buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  }
  prepare(type){
    const key=type;
    if(this.programs.has(key)){const entry=this.programs.get(key);this.program=entry.program;this.uniforms=entry.uniforms;return;}
    const gl=this.gl,shader=(kind,src)=>{const s=gl.createShader(kind);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    const vs=shader(gl.VERTEX_SHADER,VERTEX),fs=shader(gl.FRAGMENT_SHADER,fragmentFor(type));this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.bindAttribLocation(this.program,0,'a_position');gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(this.program));gl.deleteShader(vs);gl.deleteShader(fs);
    this.uniforms={};for(const name of ['resolution','seed','loop','zoomPhase','rotation','emblem','relief','phase','iterations','type','samples','chart','c0','c1','c2','c3','p0','p1','p2','p3','p4'])this.uniforms['u_'+name]=gl.getUniformLocation(this.program,'u_'+name);
    this.programs.set(key,{program:this.program,uniforms:this.uniforms});
  }
  render(settings,camera){
    this.prepare(settings.type);
    if(!camera.frame)camera=new InfiniteCamera([0,0],1,camera.angle,dynamics(settings.type,settings.c));
    const gl=this.gl;gl.useProgram(this.program);gl.viewport(0,0,this.canvas.width,this.canvas.height);
    for(const[name,value]of Object.entries(renderUniforms(settings,camera,this.canvas.width,this.canvas.height))){const u=this.uniforms[name];if(Array.isArray(value)){if(value.length===2)gl.uniform2fv(u,value);else if(value.length===3)gl.uniform3fv(u,value);else gl.uniform4fv(u,value);}else if(name==='u_type'||name==='u_iterations'||name==='u_samples')gl.uniform1i(u,value);else gl.uniform1f(u,value);}
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
}
