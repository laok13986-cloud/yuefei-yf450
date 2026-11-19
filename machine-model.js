import * as T from 'three';
// Visual reconstruction from the factory film, not a dimensional engineering model.
export function createMachine(variant = "video"){
const rail = variant === "rail";
const root=new T.Group(),groups=Array.from({length:12},(_,i)=>{const g=new T.Group();g.userData.module=i;root.add(g);return g});
function texture(paint,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;return t;}
const powder=texture((c,w,h)=>{c.fillStyle='#d4d7d4';c.fillRect(0,0,w,h);let seed=12;for(let i=0;i<19000;i++){seed=(seed*16807)%2147483647;const x=seed%w;seed=(seed*16807)%2147483647;c.fillStyle=i%2?'#bac2bd22':'#ffffff24';c.fillRect(x,seed%h,1,1)}});powder.wrapS=powder.wrapT=T.RepeatWrapping;powder.repeat.set(3,3);
const paint=new T.MeshPhysicalMaterial({map:powder,color:0xe5e9e3,metalness:.35,roughness:.3,clearcoat:.35,clearcoatRoughness:.3});
const dark=new T.MeshStandardMaterial({color:0x19232b,metalness:.75,roughness:.29}),steel=new T.MeshPhysicalMaterial({color:0xb9c5ca,metalness:.96,roughness:.2,clearcoat:.2}),chrome=new T.MeshPhysicalMaterial({color:0xd4e0e3,metalness:1,roughness:.13}),blue=new T.MeshStandardMaterial({color:0x244853,metalness:.65,roughness:.28}),rubber=new T.MeshStandardMaterial({color:0x15191d,roughness:.85}),yellow=new T.MeshStandardMaterial({color:0xdce33f,roughness:.34}),stripe=new T.MeshStandardMaterial({color:0x1e4f93,roughness:.35}),brass=new T.MeshStandardMaterial({color:0x9a8253,metalness:.88,roughness:.28});
function mesh(g,geo,mat,pos=[0,0,0],rot=[0,0,0]){const m=new T.Mesh(geo,mat);m.position.set(...pos);m.rotation.set(...rot);m.castShadow=true;m.receiveShadow=true;m.userData.module=g.userData.module;g.add(m);return m;}
function box(g,w,h,d,pos,mat=paint,r=.025){if(!r)return mesh(g,new T.BoxGeometry(w,h,d),mat,pos);r=Math.min(r,w/3,h/3,d/3);const x=-w/2,y=-h/2,s=new T.Shape();s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);const geo=new T.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.55,bevelSegments:3,steps:1});geo.translate(0,0,-d/2+r);geo.computeVertexNormals();return mesh(g,geo,mat,pos);}
function cylinder(g,r,h,pos,mat=steel,axis='z',rTop=r){const rot=axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:[0,0,0];return mesh(g,new T.CylinderGeometry(rTop,r,h,48),mat,pos,rot)}
function torus(g,r,t,pos,mat=chrome,axis='z'){return mesh(g,new T.TorusGeometry(r,t,8,64),mat,pos,axis==='x'?[0,Math.PI/2,0]:axis==='y'?[Math.PI/2,0,0]:[0,0,0])}
function beam(g,a,b,width=.1,depth=.1,mat=paint){const v=new T.Vector3(...b).sub(new T.Vector3(...a));const m=box(g,width,v.length(),depth,new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5).toArray(),mat,.012);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
function tube(g,points,r=.015,mat=rubber){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));return mesh(g,new T.TubeGeometry(curve,28,r,8,false),mat)}
function bolt(g,pos,r=.025,axis='z'){const m=cylinder(g,r,r*.7,pos,steel,axis);m.geometry.dispose();m.geometry=new T.CylinderGeometry(r,r,r*.7,6);const p=[...pos];p[axis==='z'?2:axis==='x'?0:1]+=.014;const hole=cylinder(g,r*.46,.008,p,dark,axis);return m;}
function plate(g,points,depth,pos,holes=[]){const s=new T.Shape();s.moveTo(...points[0]);points.slice(1).forEach(p=>s.lineTo(...p));s.closePath();holes.forEach(([x,y,r])=>{const h=new T.Path();h.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(h)});const geo=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.009,bevelSize:.008,bevelSegments:3,curveSegments:20});geo.translate(0,0,-depth/2);return mesh(g,geo,paint,pos)}
function decal(g,text,pos,w,h,{bg='#d9ded9',color='#203e62',size=70}={}){const tx=texture((c,W,H)=>{c.fillStyle=bg;c.fillRect(0,0,W,H);c.fillStyle=color;c.font=`600 ${size}px Arial`;c.textBaseline='middle';c.textAlign='center';c.fillText(text,W/2,H/2)},1024,256);return mesh(g,new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:tx,roughness:.45}),pos)}
// 01: formed canopy, four uprights, gussets, folded lower pan.
const g=groups[0];
const roof=new T.Group();
g.add(roof);
const roofWidth=rail?6.25:5.92;
const roofDepth=rail?2.15:1.94;
const roofEdge=roofDepth/2;
box(roof,roofWidth,.065,roofDepth,[0,3.54,0],paint,.018);
for(const z of [-roofEdge,roofEdge]){
  box(roof,roofWidth,.40,.065,[0,3.34,z],paint,.025);
  box(roof,roofWidth,.025,.015,[0,3.24,z+Math.sign(z)*.04],yellow,.004);
  box(roof,roofWidth,.02,.015,[0,3.20,z+Math.sign(z)*.04],stripe,.004);
}
for(const x of [-roofWidth/2,roofWidth/2]) box(roof,.065,.4,roofDepth,[x,3.34,0],paint,.018);
for(const side of [-1,1]){for(const z of [-.7,.7]){box(g,.17,2.95,.21,[side*1.5,1.67,z],paint,.017);box(g,.018,2.5,.016,[side*1.5,1.68,z+.112],steel,.003);for(const y of [.35,2.88,3.02])bolt(g,[side*1.5,y,z+.125],.025);plate(g,[[0,0],[.44,0],[0,-.44]],.045,[side*1.44,3.1,z]);}box(g,.74,.11,2.05,[side*1.5,.11,0],paint,.025);for(const x of [side*1.5-.24,side*1.5+.24])for(const z of [-.84,.84]){bolt(g,[x,.18,z],.04,'y');cylinder(g,.07,.055,[x,.04,z],rubber,'y')}}
box(g,3.13,.2,1.62,[0,.23,0],paint,.025);box(g,2.8,.025,1.4,[0,.35,0],steel,.008);for(const x of [-1.34,1.34]){beam(g,[x,.45,-.7],[x,3.1,-.7],.075,.08);beam(g,[x,1.8,-.7],[x*.15,3.1,-.7],.08,.06)}
decal(roof,'YF / YF-450',[-1.9,3.39,roofEdge+.04],1.3,.22,{size:65});
for(let x=-2.7;x<=2.7;x+=.45) bolt(roof,[x,3.48,roofEdge+.04],.018);
// 02: accumulator tower, individually machined rollers and bearing mounts.
function roller(group,pos,len,axis='z',r=.062){const movingRoller=cylinder(group,r,len,pos,chrome,axis);movingRoller.userData.roller=true;for(const d of [-1,1]){const p=[...pos];p[axis==='z'?2:0]+=d*(len/2+.026);cylinder(group,r*.72,.07,p,dark,axis);const p2=[...p];p2[axis==='z'?2:0]+=d*.037;bolt(group,p2,r*.45,axis)}}
if(!rail) for(const x of [-1.08,1.08]){box(groups[1],.085,2.25,.11,[x,1.65,.02],steel,.01);for(let i=0;i<7;i++)roller(groups[1],[x,.65+i*.32,0],1.32,'z',.058);for(const y of [.52,2.8])box(groups[1],.25,.095,1.53,[x,y,0],paint,.014);tube(groups[1],[[x+.14,.55,-.5],[x+.2,1.3,-.6],[x+.16,2.8,-.6]],.012,dark)}
// 03 + 04: wound paper reels, radial ply texture, hollow core and steel chucks.
const edge=texture((c,w,h)=>{c.fillStyle='#b9a07b';c.fillRect(0,0,w,h);let seed=7;for(let r=36;r<252;r+=1.1){seed=(seed*16807)%2147483647;c.strokeStyle=`rgba(${75+seed%25},${66+seed%20},${43+seed%15},${.15+seed%10/35})`;c.lineWidth=.5+seed%10/15;c.beginPath();c.arc(w/2,h/2,r,0,Math.PI*2);c.stroke()}},512,512);
const reelSide=new T.MeshStandardMaterial({map:edge,color:0xb09b7e,roughness:.9,metalness:0});const paperMap=texture((c,w,h)=>{c.fillStyle='#a58f6e';c.fillRect(0,0,w,h);for(let i=0;i<600;i++){c.fillStyle=i%2?'#75634720':'#d5c29a24';c.fillRect(i%w,0,.7,h)}},512,256);const paper=new T.MeshStandardMaterial({map:paperMap,color:0xb7a38b,roughness:.92,metalness:0});
for(let i=0;i<2;i++){const q=groups[i+2],x=(i?1:-1)*(rail?2.67:2.28);const y=rail?.88:1.08;const reel=mesh(q,new T.CylinderGeometry(.71,.71,1.45,96),[paper,reelSide,reelSide],[x,y,0],[Math.PI/2,0,0]);for(const z of [-.733,.733]){torus(q,.69,.008,[x,y,z],paper);cylinder(q,.105,.025,[x,y,z],dark);torus(q,.12,.022,[x,y,z*1.01],new T.MeshStandardMaterial({color:0x7d6448,roughness:.95}));cylinder(q,.048,.18,[x,y,z*1.06],chrome)}reel.userData.reel=true;}
// 05: sculpted mill-roll stand side plates with real through-holes and hubs.
const standShape=[[-.5,0],[.5,0],[.46,.16],[.25,.48],[.16,.84],[.39,1.02],[.45,1.2],[.28,1.29],[-.38,1.26],[-.5,1.1],[-.28,.85],[-.23,.34],[-.44,.14]];
if(!rail) for(const x of [-2.28,2.28]){const q=groups[4];for(const z of [-1.04,1.04]){plate(q,standShape,.095,[x,.18,z],[[-.05,.19,.065],[-.08,.75,.07],[.02,1.03,.16]]);box(q,1.22,.09,.6,[x,.14,z],paint,.02);cylinder(q,.205,.16,[x,1.21,z],blue);cylinder(q,.146,.04,[x,1.21,z+(z>0?.095:-.095)],dark);torus(q,.11,.012,[x,1.21,z+(z>0?.12:-.12)],chrome);for(let k=0;k<6;k++){const a=k*Math.PI/3;bolt(q,[x+Math.cos(a)*.16,1.21+Math.sin(a)*.16,z+(z>0?.09:-.09)],.018)}for(const dx of [-.44,.44]){bolt(q,[x+dx,.205,z],.035,'y');bolt(q,[x+dx,.34,z+.06],.022)}}roller(q,[x,1.08,0],2.16,'z',.047);for(const z of [-.94,.94]){cylinder(q,.075,.21,[x,1.08,z],steel);cylinder(q,.1,.09,[x,1.08,z],rubber)}}
// 06: hydraulic cylinders, polished piston rods, fittings and curved hoses.
if(!rail) for(const x of [-2.28,2.28])for(const z of [-.86,.86]){const q=groups[5];cylinder(q,.068,.56,[x+.22,.6,z],steel,'y');cylinder(q,.031,.38,[x+.22,1.03,z],chrome,'y');for(const y of [.34,.87]){cylinder(q,.09,.07,[x+.22,y,z],dark,'y');box(q,.04,.04,.1,[x+.22,y,z+.08],brass,.006)}cylinder(q,.075,.18,[x+.22,1.23,z],paint);bolt(q,[x+.22,1.23,z+.11],.03);tube(q,[[x+.23,.4,z+.1],[x+.46,.45,z+.2],[x+.49,.75,z+.08],[x+.47,.95,z-.14],[x+.25,.9,z-.1]],.018);}
// 07: splicing head, pressure bar, carriage, actuator brackets and repeated screw heads.
const head=groups[6];
if(!rail){box(head,2.72,.13,1.52,[0,2.74,0],paint,.02);box(head,2.58,.055,.38,[0,2.58,.53],steel,.012);for(const y of [2.51,2.85])roller(head,[0,y,.48],2.65,'x',.073);roller(head,[0,2.58,-.42],2.65,'x',.065);box(head,2.55,.065,.1,[0,2.5,.78],rubber,.014);for(const x of [-1.28,1.28]){plate(head,[[-.13,-.2],[.13,-.2],[.17,.2],[-.17,.2]],.08,[x,2.6,.5],[ [0,0,.06] ]);for(const z of [-.62,.62]){cylinder(head,.04,.27,[x,2.87,z],steel,'y');bolt(head,[x,3.03,z],.033,'y')}}for(let x=-1.1;x<=1.1;x+=.22)bolt(head,[x,2.62,.74],.017);}
// 08: finned motors, machined flanges, encoder housings, cable glands.
for(const x of [-1.77,1.77]){const q=groups[7];box(q,.34,.39,.43,[x,2.44,.42],blue,.035);for(let i=0;i<9;i++)box(q,.38,.014,.46,[x,2.29+i*.037,.42],dark,.004);cylinder(q,.21,.16,[x,2.44,.7],steel);cylinder(q,.105,.085,[x,2.44,.82],dark);box(q,.17,.18,.17,[x,2.75,.35],dark,.02);cylinder(q,.11,.22,[x,2.44,.13],dark);for(const dx of [-.135,.135])for(const dy of [-.135,.135])bolt(q,[x+dx,2.44+dy,.79],.023);tube(q,[[x,2.78,.35],[x+.13,2.89,.2],[x+.16,2.88,-.3],[x,2.9,-.65]],.018);}
// 09: formed control cabinet, panel seams, hinges, touchscreen, buttons and LED display.
const control=groups[8];box(control,.68,2.74,.43,[0,1.66,1.02],paint,.045);box(control,.59,1.4,.025,[0,1.98,1.252],paint,.012);for(const x of [-.31,.31])box(control,.012,2.37,.015,[x,1.66,1.251],steel,.003);for(const y of [.58,1.9]){box(control,.034,.11,.035,[-.33,y,1.24],steel,.006);bolt(control,[-.329,y,1.266],.015)}box(control,.46,.88,.038,[0,2.1,1.279],steel,.018);box(control,.34,.255,.05,[0,2.3,1.311],dark,.02);
const screenTex=texture((c,w,h)=>{c.fillStyle='#173c54';c.fillRect(0,0,w,h);c.fillStyle='#78c9e0';c.fillRect(20,18,w-40,30);c.font='26px Arial';c.fillStyle='#def5ec';c.fillText('YF450  SYSTEM',40,41);for(let i=0;i<3;i++){c.fillStyle='#2b7b8e';c.fillRect(30+i*160,85,140,85);c.fillStyle='#9ce0ca';c.fillRect(40+i*160,145,120,8)}c.fillStyle='#93c58e';c.fillRect(30,200,450,15)},512,256);mesh(control,new T.PlaneGeometry(.277,.177),new T.MeshStandardMaterial({map:screenTex,emissive:0x5abed8,emissiveMap:screenTex,emissiveIntensity:.5}),[0,2.3,1.34]);for(let i=0;i<5;i++)for(let j=0;j<3;j++){const x=(j-1)*.135,y=1.78+i*.075;torus(control,.018,.005,[x,y,1.314],chrome);cylinder(control,.014,.019,[x,y,1.317],i===4?new T.MeshStandardMaterial({color:0x89c65e,emissive:0x304319,emissiveIntensity:.3}):dark)}cylinder(control,.032,.025,[.21,2.69,1.26],yellow);cylinder(control,.025,.05,[.21,2.69,1.29],new T.MeshStandardMaterial({color:0xc93930}));box(control,.51,.18,.16,[0,3.15,1.05],dark,.02);const display=texture((c,w,h)=>{c.fillStyle='#180a08';c.fillRect(0,0,w,h);c.fillStyle='#ff6142';c.font='100px monospace';c.textAlign='center';c.fillText('YF 450',w/2,h*.7)},768,160);mesh(control,new T.PlaneGeometry(.46,.12),new T.MeshStandardMaterial({map:display,emissive:0xff5835,emissiveMap:display,emissiveIntensity:.6}),[0,3.15,1.137]);decal(control,'YF  /  SERVO SPLICER',[0,.72,1.252],.45,.1,{size:46});for(let i=0;i<9;i++)box(control,.22,.008,.012,[0,.42+i*.025,1.25],dark,.002);box(control,.075,.025,.04,[.24,1.35,1.28],dark,.006);
// 10: manifold, solenoids, tubing and filter assembly tucked behind the side frame.
const pneu=groups[9];box(pneu,.18,1.06,.54,[1.7,1.8,-.56],paint,.015);for(let i=0;i<5;i++){box(pneu,.22,.13,.35,[1.74,1.43+i*.17,-.51],steel,.01);box(pneu,.12,.11,.16,[1.88,1.43+i*.17,-.48],blue,.012);for(const z of [-.6,-.42]){cylinder(pneu,.027,.1,[1.89,1.43+i*.17,z],brass,'x');tube(pneu,[[1.94,1.43+i*.17,z],[2.02,1.5+i*.16,z-.08],[1.94,2.6,z-.2]],.008,new T.MeshStandardMaterial({color:0x164773,roughness:.45}))}}cylinder(pneu,.07,.25,[1.73,1.05,-.54],steel,'y');cylinder(pneu,.055,.22,[1.73,.82,-.54],new T.MeshPhysicalMaterial({color:0x93adba,metalness:.1,roughness:.1,transparent:true,opacity:.5}),'y');torus(pneu,.065,.012,[1.73,1.14,-.42],dark);
// 11: grooved rail tracks, low carriage and small steel wheels.
if(!rail) for(const x of [-2.28,2.28]){const q=groups[10];for(const dx of [-.38,.38]){box(q,.065,.055,3,[x+dx,.035,-.1],steel,.008);for(const z of [-1.4,-.6,.3,1.1])bolt(q,[x+dx,.072,z],.017,'y')}box(q,.83,.08,.58,[x,.12,-1.23],paint,.018);for(const dx of [-.32,.32])for(const z of [-1.42,-1.04])cylinder(q,.065,.08,[x+dx,.1,z],dark,'x');box(q,.11,.13,.45,[x,.23,-1.23],rubber,.014)}
// 12: long ground shafts, bearings, keyed coupling and drive supports.
const guide=groups[11];
for(const z of [-.76,.76]) {
  box(guide,5.7,.12,.13,[0,3.13,z],blue,.02);
  box(guide,5.55,.035,.075,[0,3.22,z],steel,.006);
}
// Bearing blocks and shaft journals are visible with the canopy lifted.
const upperRollers=rail
  ? [[-2.88,3.34],[-2.72,3.14],[-2.42,3.34],[-2.11,3.34],[1.93,3.03],[2.31,3.19],[2.91,3.34]]
  : [[-2.48,3.34],[-1.85,3.25],[-.94,3.32],[0,3.22],[.94,3.32],[1.85,3.25],[2.48,3.34]];
for(const [x,y] of upperRollers){
  roller(guide,[x,y,0],1.40,'z',.077);
  for(const z of [-.78,.78]){
    box(guide,.23,.20,.13,[x,y,z],blue,.02);
    cylinder(guide,.086,.058,[x,y,z+Math.sign(z)*.07],chrome);
    torus(guide,.065,.012,[x,y,z+Math.sign(z)*.103],dark);
    for(const dx of [-.075,.075])bolt(guide,[x+dx,y-.066,z+Math.sign(z)*.08],.016);
  }
}
if(rail){
  // PDF pp. 1 and 3: outboard reels on floor trolleys, inward hydraulic arms,
  // left upper accumulator and a recessed central splicing head.
  for(const side of [-1,1]){
    const x=side*2.67;
    const carriage=groups[10];
    for(const dx of [-.32,.32]){
      box(carriage,.13,.05,4.25,[x+dx,.025,0],dark,.008);
      box(carriage,.065,.028,4.25,[x+dx,.067,0],chrome,.006);
      for(const z of [-1.95,-1,0,1,1.95])bolt(carriage,[x+dx,.08,z],.022,'y');
    }
    box(carriage,.88,.11,1.64,[x,.115,0],blue,.022);
    for(const z of [-.64,.64]){
      box(carriage,.79,.066,.17,[x,.177,z],paint,.015);
      for(const dx of [-.30,.30])cylinder(carriage,.068,.07,[x+dx,.11,z],dark,'x');
    }
    for(const z of [-.86,.86]){
      const arm=groups[4], hydraulic=groups[5];
      const pivot=[side*1.93,1.97,z], chuck=[x,.88,z];
      box(arm,.48,.11,.47,[side*1.9,.11,z],paint,.022);
      beam(arm,[side*1.78,.16,z],pivot,.17,.19);
      beam(arm,pivot,chuck,.23,.20,blue);
      for(const [px,py,pz] of [pivot,chuck]){
        cylinder(arm,.15,.21,[px,py,pz],steel);
        torus(arm,.105,.025,[px,py,pz+Math.sign(z)*.115],dark);
      }
      const base=[side*1.99,.18,z+.10], joint=[side*2.13,1.61,z+.10];
      const mid=base.map((v,i)=>(v+joint[i])/2);
      beam(hydraulic,base,mid,.11,.11,dark);
      beam(hydraulic,mid,joint,.055,.055,chrome);
      tube(hydraulic,[base,[side*1.76,.45,z+.14],[side*1.85,.88,z+.12],mid],.017);
    }
    roller(groups[1],[side*1.32,1.97,0],1.53,'z',.071);
  }
  for(const x of [-2.75,-2.31,-1.89]){
    roller(groups[1],[x,3.02,0],1.52,'z',.072);
    box(groups[1],.15,.17,.10,[x,3.02,.8],blue,.018);
  }
  // The centered controller and splice rollers share a frame at both shaft ends.
  head.add(control);
  const spliceRollerHeights=[1.79,2.11,2.43,2.76,2.97];
  for(const y of spliceRollerHeights)roller(head,[0,y,0],1.63,'z',.073);
  for(const z of [-.92,.92]){
    const outerSide=Math.sign(z);
    box(head,1.26,.14,.35,[0,.39,z],paint,.024);
    for(const x of [-.50,.50]){
      box(head,.16,2.63,.19,[x,1.76,z],paint,.019);
      beam(head,[x,.51,z],[x,1.23,z-outerSide*.45],.09,.09,blue);
      bolt(head,[x,.48,z+outerSide*.11],.022,'y');
    }
    for(const y of spliceRollerHeights){
      box(head,1.10,.11,.14,[0,y,z],blue,.015);
      box(head,.24,.20,.19,[0,y,z-outerSide*.05],blue,.019);
      cylinder(head,.077,.07,[0,y,z+outerSide*.092],chrome);
      for(const x of [-.078,.078])bolt(head,[x,y-.055,z+outerSide*.10],.016);
    }
  }
  for(const x of [-.50,.50]){
    box(head,.18,.12,1.84,[x,.45,0],paint,.018);
    box(head,.15,.11,1.84,[x,3.05,0],blue,.016);
  }
}
const offsets=[[0,0,0],[0,1.3,-1.6],[-1.6,0,.1],[1.6,0,.1],[-.6,0,1.5],[1.0,.25,-1.4],[0,1.65,.3],[0,1.0,1.6],rail?[0,0,0]:[0,.2,2.0],[1.8,.65,-.8],[0,0,-1.6],[0,1.9,1.8]];
groups.forEach((q,i)=>{q.userData.offset=new T.Vector3(...offsets[i]);q.traverse(m=>{if(m.isMesh){m.userData.module=i;m.userData.normalMaterial=m.material}})});
function poseAssembly(progress){
  // Lift the cover free of the bearings, then move it behind the machine
  // before advancing the guide rollers. Reassembly reverses the same path.
  const lift=T.MathUtils.smoothstep(progress,0,.12);
  const retreat=T.MathUtils.smoothstep(progress,.12,.30);
  const separation=T.MathUtils.smoothstep(progress,.30,1);
  roof.position.set(0,.85*lift+1.2*retreat,-2.4*retreat);
  groups.forEach(group=>group.position.copy(group.userData.offset).multiplyScalar(separation));
}
return {root,groups,poseAssembly};
}
