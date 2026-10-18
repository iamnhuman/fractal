import {dynamics} from './fractal-math.js?v=7';
export class InfiniteCamera{
  constructor(center=[0,0],scale=1,angle=0,model=dynamics(0)){this.reset(center,scale,angle,model);}
  reset(center,scale=1,angle=0,model=this.model){this.model=model;this.baseScale=1;this.scale=1;this.angle=angle;this.level=0;this.phase=0;}
  get center(){return[0,0];}
  get rotation(){return this.angle;}
  zoom(factor){
    if(!(factor>0)||!Number.isFinite(factor))return;
    const total=this.phase-Math.log(factor)/Math.log(this.model.ratio);let cycles=Math.floor(total),phase=total-cycles;
    if(phase<1e-12)phase=0;else if(1-phase<1e-12){phase=0;cycles++;}
    this.phase=phase;this.level+=cycles;this.scale=Math.exp(-phase*Math.log(this.model.ratio));
  }
  fly(dt,speed=1){this.zoom(Math.exp(-dt*.5*speed));}
  frame(){return{center:[0,0],scale:this.scale,rotation:this.angle,phase:this.phase,depth:this.level,model:this.model};}
  get logZoom(){return(this.level+this.phase)*Math.log(this.model.ratio);}
  get zoomLabel(){const e=this.logZoom/Math.LN10;return Math.abs(e)<6?Math.exp(this.logZoom).toFixed(e>2?0:2)+'×':'10^'+e.toFixed(1)+'×';}
  snapshot(){return{center:[0,0],level:this.level,phase:this.phase,scale:this.scale,angle:this.angle,zoom:this.zoomLabel};}
}
