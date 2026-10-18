import {dynamics,mul} from './fractal-math.js?v=3';
const TAU=2*Math.PI;
// A chart change follows the polynomial itself: L(k+1, lambda*q) = f(L(k,q)).
// There are no alternate images, spatial tiling, opacity transitions, or random levels.
export class InfiniteCamera{
  constructor(center=[0,0],scale=.7,angle=0,model=dynamics(0,[-.74543,.11301])){this.reset(center,scale,angle,model);}
  reset(center,scale,angle=0,model=this.model){this.model=model;this.center=[...center];this.scale=scale;this.baseScale=scale;this.angle=angle;this.level=0;this.chartAngle=0;}
  get rotation(){return this.angle-this.chartAngle;}
  offset(x,y){const c=Math.cos(this.rotation),s=Math.sin(this.rotation);return[(c*x+s*y)*this.scale,(-s*x+c*y)*this.scale];}
  pan(x,y){this.center[0]+=x;this.center[1]+=y;}
  zoom(factor,anchor=[0,0]){
    if(!(factor>0)||!Number.isFinite(factor))return;
    const before=this.offset(...anchor);this.scale*=factor;
    if(this.level===0)this.scale=Math.min(this.baseScale*4,this.scale);
    const after=this.offset(...anchor);this.pan(before[0]-after[0],before[1]-after[1]);
    const {ratio,multiplier,turn}=this.model;
    while(this.scale<this.baseScale/ratio){this.center=mul(this.center,multiplier);this.scale*=ratio;this.level++;this.chartAngle=(this.chartAngle+turn)%TAU;}
    while(this.scale>=this.baseScale&&this.level>0){const d=ratio*ratio;this.center=mul(this.center,[multiplier[0]/d,-multiplier[1]/d]);this.scale/=ratio;this.level--;this.chartAngle=(this.chartAngle-turn)%TAU;}
  }
  fly(dt,speed=1){
    // The fixed point is on the same Julia set at every magnification.
    // Return gently to it after manual exploration; never drift into an empty basin.
    const approach=Math.exp(-dt*speed*1.1);this.center=this.center.map(x=>x*approach);
    this.zoom(Math.exp(-dt*.22*speed));
  }
  frame(){return{center:[...this.center],scale:this.scale,rotation:this.rotation,depth:this.level,model:this.model};}
  get logZoom(){return this.level*Math.log(this.model.ratio)+Math.log(this.baseScale/this.scale);}
  get zoomLabel(){const e=this.logZoom/Math.LN10;return e<6?Math.exp(this.logZoom).toFixed(e>2?0:2)+'×':'10^'+e.toFixed(1)+'×';}
  snapshot(){return{center:[...this.center],level:this.level,scale:this.scale,angle:this.angle,rotation:this.rotation,zoom:this.zoomLabel};}
}
