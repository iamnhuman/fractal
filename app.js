import {FractalRenderer, PALETTES, SCENES, GEOMETRIES} from './engine.js?v=3';
import {InfiniteCamera} from './navigation.js?v=3';
import {dynamics} from './fractal-math.js?v=3';

const $=id=>document.getElementById(id);
const canvas=$('fractal');
const settings={detail:220,emblem:SCENES[0].emblem,relief:65,palette:0,type:0,c:[...SCENES[0].c],phase:0,speed:1,rotate:false};
const camera=new InfiniteCamera(SCENES[0].center,SCENES[0].scale,SCENES[0].angle);
let renderer,exportRenderer,sceneIndex=0,format='16:9',playing=false,dirty=true;
let lastTime=0,recording=null,toastTimer,renderAvailable=false;

function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4000);}
function segmented(id,value){document.querySelectorAll('#'+id+' button').forEach(b=>{const on=b.dataset.value===String(value);b.classList.toggle('selected',on);b.setAttribute('aria-pressed',String(on));});}
function syncSliders(){for(const id of ['detail','emblem','relief','speed']){const input=$(id);input.value=settings[id];input.style.setProperty('--fill',((input.value-input.min)/(input.max-input.min)*100)+'%');$(id+'Value').textContent=id==='detail'?settings[id]:id==='speed'?settings[id].toFixed(1)+'×':settings[id]+'%';} $('rotate').checked=settings.rotate;}
function syncPalette(){document.querySelectorAll('.palette').forEach((b,i)=>{b.classList.toggle('selected',i===settings.palette);b.setAttribute('aria-pressed',String(i===settings.palette));});$('paletteName').textContent=PALETTES[settings.palette].name;}
function syncScene(){document.querySelectorAll('.scene').forEach((b,i)=>{b.classList.toggle('selected',i===sceneIndex);b.setAttribute('aria-pressed',String(i===sceneIndex));});const s=SCENES[sceneIndex];$('sceneName').textContent=String(sceneIndex+1).padStart(2,'0')+' — '+s.name.toUpperCase();document.querySelector('.scenes-section .mono').textContent=String(sceneIndex+1).padStart(2,'0')+' / '+SCENES.length;const threeD=settings.type>=8;$('geometryNote').textContent=threeD?'Объём · свет и перспектива':'Julia · самоподобные ветви';}
function syncPlay(){const b=$('playButton');b.classList.toggle('playing',playing);b.querySelector('use').setAttribute('href',playing?'#pause':'#play');b.querySelector('span').textContent=playing?'Пауза':'Начать полёт';b.setAttribute('aria-label',playing?'Остановить полёт':'Запустить полёт');b.setAttribute('aria-pressed',String(playing));}
function setPlaying(value){playing=value;syncPlay();dirty=true;}
function resetCamera(){const s=SCENES[sceneIndex];camera.reset(s.center,s.scale,s.angle,dynamics(settings.type,settings.c));dirty=true;}
function selectScene(index){sceneIndex=index;const s=SCENES[index];Object.assign(settings,{palette:s.palette,c:[...s.c],type:s.type,emblem:s.emblem,phase:0});resetCamera();syncScene();syncPalette();syncSliders();$('fractalType').value=String(settings.type);resize();}
function makeUI(){
  SCENES.forEach((s,i)=>{const b=document.createElement('button');b.className='scene';b.title=s.description;b.innerHTML=`<img src="previews/${String(i+1).padStart(2,'0')}.jpg?v=3" alt="Фрактал ${s.name}" width="256" height="144"><span class="scene-info"><strong>${s.name.toUpperCase()}</strong><span>${s.type>=8?'3D':String(i+1).padStart(2,'0')}</span></span>`;b.addEventListener('click',()=>selectScene(i));$('scenes').append(b);});
  PALETTES.forEach((p,i)=>{const b=document.createElement('button');b.className='palette';b.title=p.name;b.setAttribute('aria-label','Палитра '+p.name);p.swatches.forEach(c=>{const sw=document.createElement('i');sw.style.background=c;b.append(sw);});b.addEventListener('click',()=>{settings.palette=i;syncPalette();dirty=true;});$('palettes').append(b);});
  GEOMETRIES.forEach((name,i)=>{const option=document.createElement('option');option.value=i;option.textContent=name;$('fractalType').append(option);});
  syncScene();syncPalette();syncSliders();syncPlay();
}
function resize(){if(!renderer)return;const viewport=$('viewport'),wrap=$('canvasWrap');if(!document.fullscreenElement){const [a,b]=format.split(':').map(Number),ratio=a/b;let availableWidth=viewport.clientWidth,availableHeight=viewport.clientHeight;if(window.innerWidth<=800)availableHeight=format==='9:16'?window.innerHeight*.57:availableWidth/ratio;const width=Math.min(availableWidth,availableHeight*ratio);wrap.style.width=width+'px';wrap.style.height=width/ratio+'px';}const bounds=canvas.getBoundingClientRect();const dpr=Math.min(window.devicePixelRatio||1,1.75);const maxPixels=settings.type>=8?480000:1500000;const scale=Math.min(dpr,Math.sqrt(maxPixels/Math.max(1,bounds.width*bounds.height)));const w=Math.max(1,Math.round(bounds.width*scale)),h=Math.max(1,Math.round(bounds.height*scale));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;dirty=true;}}
function outputSize(max){const [a,b]=format.split(':').map(Number);return a>=b?[max,Math.round(max*b/a)]:[Math.round(max*a/b),max];}
function getExportRenderer(){if(!exportRenderer)exportRenderer=new FractalRenderer(document.createElement('canvas'));return exportRenderer;}
function screenAt(clientX,clientY){const r=canvas.getBoundingClientRect();return[((clientX-r.left)/r.width*2-1)*(r.width/r.height),1-(clientY-r.top)/r.height*2];}
function zoomAt(factor,x,y){if(recording)return;camera.zoom(factor,screenAt(x,y));dirty=true;}
function zoomCenter(factor){const r=canvas.getBoundingClientRect();zoomAt(factor,r.left+r.width/2,r.top+r.height/2);}
function animate(time){
  requestAnimationFrame(animate);if(!renderAvailable||document.hidden){lastTime=time;return;}
  const dt=Math.min((time-lastTime)/1000,.06);lastTime=time;
  if(playing){
    camera.fly(dt,settings.speed);
    if(settings.rotate)camera.angle+=dt*.035*settings.speed;
    dirty=true;
  }
  if(dirty){renderer.render(settings,camera);$('zoomValue').textContent=camera.zoomLabel;dirty=false;}
  if(recording){const elapsed=performance.now()-recording.start;$('recordingTime').textContent=`00:${String(Math.min(10,Math.floor(elapsed/1000))).padStart(2,'0')} / 00:10`;recording.renderer.render(recording.settings,camera);}
}
const pointers=new Map();let drag=null,pinch=null;
canvas.addEventListener('pointerdown',e=>{if(recording)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);setPlaying(false);if(pointers.size===1)drag=[e.clientX,e.clientY];if(pointers.size===2){const p=[...pointers.values()];pinch={distance:Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])};drag=null;}});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);if(pointers.size===2&&pinch){const p=[...pointers.values()],distance=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]);zoomAt(pinch.distance/Math.max(1,distance),(p[0][0]+p[1][0])/2,(p[0][1]+p[1][1])/2);pinch.distance=distance;}else if(drag&&pointers.size===1){const r=canvas.getBoundingClientRect(),delta=camera.offset((drag[0]-e.clientX)/r.height*2,(e.clientY-drag[1])/r.height*2);camera.pan(...delta);drag=[e.clientX,e.clientY];dirty=true;}});
function endPointer(e){pointers.delete(e.pointerId);drag=null;pinch=null;}
canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);canvas.addEventListener('lostpointercapture',endPointer);
canvas.addEventListener('wheel',e=>{e.preventDefault();setPlaying(false);zoomAt(Math.exp(Math.max(-150,Math.min(150,e.deltaY))*.0015),e.clientX,e.clientY);},{passive:false});
canvas.addEventListener('dblclick',e=>zoomAt(.5,e.clientX,e.clientY));

for(const id of ['detail','emblem','relief','speed'])$(id).addEventListener('input',e=>{settings[id]=Number(e.target.value);syncSliders();dirty=true;});
$('rotate').addEventListener('change',e=>settings.rotate=e.target.checked);
$('fractalType').addEventListener('change',e=>{const type=Number(e.target.value);selectScene(SCENES.findIndex(s=>s.type===type));});
document.querySelectorAll('#formats button').forEach(b=>b.addEventListener('click',()=>{if(recording)return;format=b.dataset.value;segmented('formats',format);$('canvasWrap').classList.toggle('portrait',format==='9:16');$('canvasWrap').classList.toggle('square',format==='1:1');resize();dirty=true;}));
$('playButton').addEventListener('click',()=>setPlaying(!playing));$('resetButton').addEventListener('click',resetCamera);$('zoomIn').addEventListener('click',()=>zoomCenter(.7));$('zoomOut').addEventListener('click',()=>zoomCenter(1.4));
$('randomize').addEventListener('click',()=>{const index=Math.floor(Math.random()*SCENES.length);selectScene(index);settings.c[0]+=(Math.random()-.5)*.025;settings.c[1]+=(Math.random()-.5)*.025;settings.phase=Math.random();resetCamera();camera.angle=Math.random()*Math.PI*2;dirty=true;toast('Новая вариация готова');});
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else if($('canvasWrap').requestFullscreen)await $('canvasWrap').requestFullscreen();else toast('Полный экран недоступен в этом браузере');}catch{toast('Браузер не разрешил полный экран');}}
$('fullscreen').addEventListener('click',fullscreen);
$('helpButton').addEventListener('click',()=>$('helpDialog').showModal());$('closeHelp').addEventListener('click',()=>$('helpDialog').close());$('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog')){const r=$('helpDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('helpDialog').close();}});
document.addEventListener('keydown',e=>{if(e.target.matches('input,select,button,a')||$('helpDialog').open||recording)return;if(e.code==='Space'){e.preventDefault();setPlaying(!playing);}if(e.key.toLowerCase()==='r')resetCamera();if(e.key.toLowerCase()==='f')fullscreen();});
function saveBlob(blob,extension){if(!blob){toast('Не удалось создать файл. Попробуй ещё раз.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`fractal-${SCENES[sceneIndex].name.toLowerCase().replaceAll(' ','-')}-${Date.now()}.${extension}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}
$('pngButton').addEventListener('click',()=>{if(!renderAvailable)return;const b=$('pngButton');b.disabled=true;try{const r=getExportRenderer();[r.canvas.width,r.canvas.height]=outputSize(3840);r.render(settings,camera);r.canvas.toBlob(blob=>{saveBlob(blob,'png');b.disabled=false;if(blob)toast('PNG в 4K подготовлен для скачивания');},'image/png');}catch(error){b.disabled=false;toast('Экспорт не удался: '+error.message);}});
function lockRecording(value){document.querySelectorAll('.sidebar button,.sidebar input,.sidebar select,#formats button,#fractalType button,#resetButton,#zoomIn,#zoomOut,#pngButton,#playButton').forEach(el=>el.disabled=value);$('recordingBadge').hidden=!value;$('videoButton').classList.toggle('recording',value);$('videoLabel').textContent=value?'Остановить':'Записать видео';$('videoButton').querySelector('.export-duration').textContent=value?'■':'10 сек';$('renderStatus').textContent=value?'RECORDING':'LIVE RENDER';}
function stopRecording(){if(recording&&recording.recorder.state!=='inactive')recording.recorder.stop();}
$('videoButton').addEventListener('click',()=>{
  if(recording){stopRecording();return;}if(!renderAvailable)return;
  if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){toast('Запись видео недоступна в этом браузере. Используй Chrome или Edge.');return;}
  let stream,recorder,previousPlaying=playing;
  try{
    const r=getExportRenderer();[r.canvas.width,r.canvas.height]=outputSize(1920);r.render(settings,camera);
    const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(type=>MediaRecorder.isTypeSupported(type));
    if(!mime){toast('Браузер не поддерживает подходящий видеоформат');return;}
    stream=r.canvas.captureStream(30);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:10000000});const chunks=[];
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    const restore=()=>{if(recording)clearTimeout(recording.timer);stream.getTracks().forEach(t=>t.stop());recording=null;lockRecording(false);setPlaying(previousPlaying);};
    recorder.onstop=()=>{restore();if(chunks.length){saveBlob(new Blob(chunks,{type:mime}),mime.includes('mp4')?'mp4':'webm');toast('Видео готово для скачивания');}else toast('Запись получилась пустой. Попробуй ещё раз.');};
    recorder.onerror=()=>{restore();toast('Не удалось записать видео. Попробуй в другом браузере.');};
    recorder.start(250);recording={recorder,renderer:r,settings:{...settings,c:[...settings.c]},start:performance.now(),timer:setTimeout(stopRecording,10000)};setPlaying(true);lockRecording(true);
  }catch(error){stream?.getTracks().forEach(t=>t.stop());recording=null;lockRecording(false);setPlaying(previousPlaying);toast('Запись не удалась: '+error.message);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&recording)stopRecording();lastTime=performance.now();dirty=true;});
window.addEventListener('pagehide',stopRecording);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderAvailable=false;stopRecording();$('canvasError').hidden=false;$('canvasError').querySelector('h2').textContent='Видеокарта приостановлена';$('canvasError').querySelector('p').textContent='Генератор восстановится, когда браузер вернёт доступ к видеокарте.';});
canvas.addEventListener('webglcontextrestored',()=>{renderer=new FractalRenderer(canvas);renderAvailable=true;$('canvasError').hidden=true;resize();dirty=true;});
makeUI();
if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream){$('videoLabel').textContent='Видео в Chrome';$('videoButton').title='Для записи видео открой эту страницу в Chrome или Edge';}
document.addEventListener('fullscreenchange',()=>{resize();dirty=true;});
try{renderer=new FractalRenderer(canvas);renderAvailable=true;resize();renderer.render(settings,camera);new ResizeObserver(resize).observe($('viewport'));window.addEventListener('resize',resize);requestAnimationFrame(animate);}catch(error){console.error(error);$('canvasError').hidden=false;$('renderStatus').textContent='WEBGL UNAVAILABLE';$('pngButton').disabled=true;$('videoButton').disabled=true;$('playButton').disabled=true;}

// Read-only state and a rendered pixel probe for diagnostics, without exposing mutations.
window.fractalStudio={getState:()=>({settings:{...settings,c:[...settings.c]},camera:camera.snapshot(),playing,format,recording:!!recording,renderAvailable,resolution:[canvas.width,canvas.height]}),pixelProbe:()=>{const gl=renderer.gl,p=new Uint8Array(4);gl.readPixels(Math.floor(canvas.width/2),Math.floor(canvas.height/2),1,1,gl.RGBA,gl.UNSIGNED_BYTE,p);return [...p];}};
