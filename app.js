import {createPaperMotion} from './paper-motion.js';
import {t,initLanguage} from './i18n.js';
import * as T from 'three';
import {OrbitControls} from './assets/OrbitControls.js';
import {RoomEnvironment} from './assets/RoomEnvironment.js';
import {createMachine} from './machine-model.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const modules=[['机架与承载结构','四立柱机架、上部护罩、加固支撑与下部承载平台，组成整机的稳定骨架。','钣金机架','承载与支撑'],['储纸架总成','储纸架与成组导辊组织纸带路径，各辊体、轴端与支承结构在整体中清晰呈现。','成组导辊','纸带导向'],['左侧原纸卷','层叠纸卷、纸芯与夹持轴构成原纸放料区域。纸卷重量与材料特性影响实际接纸工况。','300–1500 mm','适用卷径'],['右侧原纸卷','另一侧原纸放料位置与接纸总成形成完整纸带处理路径。纸幅依据所选整机机型确定。','50–440 g/m²','适用原纸定量'],['原纸夹紧机构','侧板、轴端夹持及支撑底座配合，完成纸卷定位。可旋转查看侧板孔位和轴承连接。','原纸定位','夹紧与支撑'],['原纸升降机构','升降油缸与支撑结构协同，配合纸卷装载和位置调整。活塞杆与液压管路作外观还原。','液压升降','纸卷装载'],['接纸与压纸总成','压纸板、胶带压辊与二次碾压辊共同构成接纸区域。拆开总成，查看其与导纸结构的关系。','450 m/min*','最高接纸速度'],['加速与张力驱动','两套驱动分别服务加速与张力控制。电机、法兰与线缆与机器整体布局相互衔接。','双伺服','协同控制'],['操作与电控柜','集中式操作面板集成人机界面和操作按钮。通过正面视角查看屏幕、按钮与柜体细节。','集中操作','人机界面'],['气动执行总成','阀组、过滤调压与气路连接共同组成执行系统，协调接纸过程中的相关动作。','6 bar','设定供气压力'],['地轨送纸小车','机底地轨与低位送纸小车服务纸卷装载。轨道、车体与滚轮体现整体装载关系。','地轨装载','原纸输送'],['顶部轴承与导引系统','打开顶部护罩可查看承托梁、轴承座、导辊与轴端。','轴系传动','储纸架驱动']];
let camera,renderer,controls,scene,groups=[],machine,explode=0,target=0,auto=!matchMedia('(prefers-reduced-motion: reduce)').matches,wire=false,selected=0;let selectedOutline,paperMotion,roof;
const models=new Map();
let variant="video", roofOpen=false;let runRequested=false,runActive=false;
function select(i){selected=i;$('#part-name').textContent=t(modules[i][0]);$('#part-description').textContent=t(modules[i][1]);$('#part-number').textContent=`${String(i+1).padStart(2,'0')} / 12`;$('#part-facts').replaceChildren(...[['系统特点',modules[i][2]],['功能',modules[i][3]]].map(([key,value])=>{const d=document.createElement('div'),s=document.createElement('span'),b=document.createElement('b');s.textContent=t(key);b.textContent=t(value);d.append(s,b);return d}));$$('.modules button').forEach((b,n)=>b.classList.toggle('selected',n===i));if(selectedOutline){scene.remove(selectedOutline);selectedOutline.geometry.dispose();selectedOutline=null}if(machine&&target>.1){const bounds=new T.Box3().setFromObject(groups[i]);selectedOutline=new T.Box3Helper(bounds,0xb9f576);selectedOutline.material.transparent=true;selectedOutline.material.opacity=.3;scene.add(selectedOutline)}}
modules.forEach((m,i)=>{const b=document.createElement('button'),n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,t(m[0]));b.onclick=()=>select(i);$('#modules').append(b)});
function setExplode(v){if(Number(v)>0)stopMotion();target=Number(v)/100;$('#explode').value=v;$('#amount').textContent=v+'%';$('#assemble').classList.toggle('active',!target);$('#disassemble').classList.toggle('active',!!target);updateMotionUI();if(selectedOutline){scene.remove(selectedOutline);selectedOutline.geometry.dispose();selectedOutline=null}if(camera){const direction=camera.position.clone().sub(controls.target).normalize();const distance=Math.max(target>0?12.8:10.7,(target>0?5.1:3.65)/(Math.tan(camera.fov*Math.PI/360)*camera.aspect));controls.target.set(0,target>0?2.0:1.65,0);camera.position.copy(controls.target).addScaledVector(direction,distance)}}
function loadModel(){
  if(machine)machine.visible=false;
  if(!models.has(variant)){
    const model=createMachine(variant);
    model.motion=createPaperMotion(model.root,variant);
    models.set(variant,model);
    scene.add(model.root);
  }
  const model=models.get(variant);
  ({root:machine,groups,roof,motion:paperMotion}=model);
  machine.visible=true;
  groups.forEach(group=>group.position.set(0,0,0));
  roof.position.set(0,0,0);
}
$('#machine-style').onchange=e=>{
  if(!machine)return;
  stopMotion();
  if(wire)$('#xray').click();
  setExplode(0);
  explode=0;
  variant=e.target.value;
  loadModel();
  select(roofOpen?11:0);
};
$('#roof-toggle').onclick=()=>{
  stopMotion();
  roofOpen=!roofOpen;
  updateRoofButton();
  if(roofOpen)select(11);
};
function updateRoofButton(){
  $('#roof-toggle').textContent=t(roofOpen?'合上顶部护罩':'查看顶部导引');
  $('#roof-toggle').setAttribute('aria-pressed',String(roofOpen));
}
function init(){scene=new T.Scene();camera=new T.PerspectiveCamera(36,1,.1,70);camera.position.set(6.3,4.6,9.0);renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0x0a1219,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;$('#scene').append(renderer.domElement);$('#loading').remove();const pmrem=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();scene.environmentIntensity=.65;scene.add(new T.HemisphereLight(0xd8e7ef,0x30353c,1.8));
const key=new T.DirectionalLight(0xfff3dc,4.3);key.position.set(2,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.1,far:22});key.shadow.bias=-.0004;key.shadow.normalBias=.025;scene.add(key);const rim=new T.DirectionalLight(0x8ac8e3,2.3);rim.position.set(-5,4,-3);scene.add(rim);const fill=new T.DirectionalLight(0xc4e1e1,.8);fill.position.set(6,2,-2);scene.add(fill);
const floor=new T.Mesh(new T.PlaneGeometry(50,50),new T.ShadowMaterial({color:0x000000,opacity:.36}));floor.rotation.x=-Math.PI/2;floor.position.y=-.027;floor.receiveShadow=true;scene.add(floor);const grid=new T.GridHelper(28,56,0x26434b,0x172b36);grid.position.y=-.035;grid.material.transparent=true;grid.material.opacity=.3;scene.add(grid);const ring=new T.Mesh(new T.RingGeometry(4.1,4.108,160),new T.MeshBasicMaterial({color:0x648b87,transparent:true,opacity:.32,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.025;scene.add(ring);
loadModel();controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.65,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=6;controls.maxDistance=29;controls.minPolarAngle=.3;controls.maxPolarAngle=Math.PI*.49;controls.autoRotate=auto;controls.autoRotateSpeed=.38;const resize=()=>{const r=$('#scene').getBoundingClientRect();camera.aspect=r.width/r.height;camera.updateProjectionMatrix();const direction=camera.position.clone().sub(controls.target).normalize();const distance=Math.max(target>0?12.8:10.7,(target>0?5.1:3.65)/(Math.tan(camera.fov*Math.PI/360)*camera.aspect));camera.position.copy(controls.target).addScaledVector(direction,distance);renderer.setSize(r.width,r.height,false)};new ResizeObserver(resize).observe($('#scene'));resize();let down;renderer.domElement.addEventListener('pointerdown',e=>down=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>5)return;const r=renderer.domElement.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);const hit=ray.intersectObject(machine,true)[0];if(hit&&Number.isInteger(hit.object.userData.module))select(hit.object.userData.module)});
let last=0;function tick(t){requestAnimationFrame(tick);if(t-last<30)return;const dt=Math.min((t-last)/1000,.07);last=t;explode+=(target-explode)*.075;groups.forEach(g=>g.position.copy(g.userData.offset).multiplyScalar(explode));const lift=Math.max(roofOpen?1:0,explode);roof.position.y+=(1.34*lift-roof.position.y)*.12;roof.position.z+=(-.73*lift-roof.position.z)*.12;if(selectedOutline)selectedOutline.box.setFromObject(groups[selected]);const shouldRun=runRequested&&target===0&&explode<.003&&Math.abs(roof.position.y)<.01;if(shouldRun!==runActive){runActive=shouldRun;paperMotion.setVisible(runActive);updateMotionUI()}if(runActive)paperMotion.update(dt);controls.update();renderer.render(scene,camera)}requestAnimationFrame(tick)}
$('#explode').oninput=e=>setExplode(e.target.value);$('#assemble').onclick=()=>{stopMotion();setExplode(0)};$('#disassemble').onclick=()=>setExplode(100);$('#auto').onclick=()=>{auto=!auto;if(controls)controls.autoRotate=auto;$('#auto').textContent=t(auto?'暂停旋转 Ⅱ':'自动旋转 ↻');$('#auto').setAttribute('aria-pressed',String(auto))};$('#reset').onclick=()=>{stopMotion();if(camera){camera.position.set(6.3,4.6,9);controls.target.set(0,1.65,0);controls.update();setExplode(0)}};$('#xray').onclick=()=>{stopMotion();wire=!wire;if(machine)machine.traverse(o=>{if(!o.isMesh)return;if(wire){o.material=Array.isArray(o.userData.normalMaterial)?o.userData.normalMaterial.map(()=>new T.MeshBasicMaterial({color:0x9fc9c7,wireframe:true,transparent:true,opacity:.28})):new T.MeshBasicMaterial({color:0x9fc9c7,wireframe:true,transparent:true,opacity:.28})}else{const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());o.material=o.userData.normalMaterial}});$('#xray').classList.toggle('active',wire);$('#xray').setAttribute('aria-pressed',String(wire))};
window.addEventListener('site-languagechange',()=>{select(selected);$$('.modules button').forEach((b,i)=>{b.lastChild.textContent=t(modules[i][0])});$('#auto').textContent=t(auto?'暂停旋转 Ⅱ':'自动旋转 ↻');updateMotionUI();updateRoofButton()});
function updateMotionUI(){$('#run').textContent=t(runRequested?'停止运行 ■':'运行演示 ▶');$('#run').setAttribute('aria-pressed',String(runRequested));$('#run').classList.toggle('active',runRequested);$('#motion-status').textContent=t(runActive?'运行中 · 纸带沿箭头移动':runRequested?'正在合拢整机…':target>0?'拆解视图 · 运行已停止':'静态整机');$('.motion-legend').classList.toggle('running',runActive)}
function stopMotion(){runRequested=false;runActive=false;paperMotion?.setVisible(false);updateMotionUI()}
$('#run').onclick=()=>{if(runRequested){stopMotion();return}if(wire)$('#xray').click();roofOpen=false;updateRoofButton();runRequested=true;setExplode(0);updateMotionUI()};
select(0);initLanguage();try{init()}catch(error){console.error('Model renderer unavailable',error);$('#scene').hidden=true;$('#fallback').hidden=false;['#auto','#reset','#xray','#assemble','#disassemble','#explode','#run','#machine-style','#roof-toggle'].forEach(s=>$(s).disabled=true)}if(!auto){$('#auto').textContent=t('自动旋转 ↻');$('#auto').setAttribute('aria-pressed','false')}
