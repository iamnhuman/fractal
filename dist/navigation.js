// Unbounded base-16 cell addresses; floats are only used inside the current cell.
const mod = (n, d) => ((n % d) + d) % d;
export class InfiniteCamera {
  constructor(center=[0,0],scale=.5,angle=0){this.reset(center,scale,angle);}
  reset(center,scale,angle=0){this.cell=[0n,0n];this.center=[...center];this.level=0;this.scale=scale;this.angle=angle;this.baseScale=scale;this.normalize();}
  normalize(){for(let a=0;a<2;a++){const n=Math.floor(this.center[a]);this.cell[a]+=BigInt(n);this.center[a]-=n;}}
  offset(x,y){const c=Math.cos(this.angle),s=Math.sin(this.angle);return[(c*x+s*y)*this.scale,(-s*x+c*y)*this.scale];}
  pan(x,y){this.center[0]+=x;this.center[1]+=y;this.normalize();}
  zoom(factor,anchor=[0,0]){
    if(!(factor>0)||!Number.isFinite(factor))return;
    const before=this.offset(...anchor);this.scale*=factor;
    if(this.level===0)this.scale=Math.min(3.5,this.scale);
    const after=this.offset(...anchor);this.pan(before[0]-after[0],before[1]-after[1]);
    while(this.scale<1/16){this.scale*=16;this.level++;for(let a=0;a<2;a++){this.cell[a]*=16n;this.center[a]*=16;}this.normalize();}
    while(this.scale>=1&&this.level>0){this.scale/=16;this.level--;for(let a=0;a<2;a++){const r=mod(this.cell[a],16n);this.cell[a]=(this.cell[a]-r)/16n;this.center[a]=(Number(r)+this.center[a])/16;}}
    if(this.level===0)this.scale=Math.min(3.5,this.scale);
  }
  sample(targetLevel){
    const d=targetLevel-this.level;
    const origin=this.cell.map((cell,a)=>{
      if(d>=0){const f=16n**BigInt(d);return Number(mod(cell*f,4n))+this.center[a]*Number(f);}
      const bits=BigInt(-d*4),divisor=1n<<bits,r=mod(cell,divisor),parent=(cell-r)/divisor;
      const shift=bits>48n?bits-48n:0n;
      return Number(mod(parent,4n))+Number(r>>shift)/2**Number(bits-shift)+this.center[a]*16**d;
    });
    return{origin:origin.map(n=>((n%4)+4)%4),scale:this.scale*16**d,level:targetLevel};
  }
  layers(){const depth=this.level-Math.log(this.scale)/Math.log(16),level=Math.floor(depth),fraction=depth-level,t=Math.max(0,Math.min(1,(fraction-.12)/.76));return{coarse:this.sample(level),fine:this.sample(level+1),blend:t*t*(3-2*t)};}
  get logZoom(){return this.level*Math.log(16)+Math.log(this.baseScale/this.scale);}
  get zoomLabel(){const e=this.logZoom/Math.LN10;return e<6?Math.exp(this.logZoom).toFixed(e>2?0:2)+'×':'10^'+e.toFixed(1)+'×';}
  snapshot(){return{center:[...this.center],cell:this.cell.map(String),level:this.level,scale:this.scale,angle:this.angle,zoom:this.zoomLabel};}
}
