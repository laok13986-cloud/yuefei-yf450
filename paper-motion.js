import * as T from 'three';
// Illustrative web route. Timing and paper deformation are not a production simulation.
export function createPaperMotion(machine){
 const group=new T.Group();group.visible=false;machine.add(group);
 const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d');ctx.fillStyle='#bba17b';ctx.fillRect(0,0,256,512);for(let i=0;i<512;i+=4){ctx.fillStyle=i%8?'#c9b38a':'#ae9371';ctx.fillRect(0,i,256,1)}ctx.strokeStyle='#405d4d';ctx.fillStyle='#405d4d';ctx.lineWidth=4;for(const y of [70,240,410]){ctx.beginPath();ctx.moveTo(128,y+35);ctx.lineTo(128,y-28);ctx.stroke();ctx.beginPath();ctx.moveTo(111,y-7);ctx.lineTo(128,y-28);ctx.lineTo(145,y-7);ctx.stroke()}const texture=new T.CanvasTexture(c);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.colorSpace=T.SRGBColorSpace;texture.repeat.set(1,4);texture.anisotropy=4;
 const mat=new T.MeshStandardMaterial({map:texture,color:0xc4b08f,side:T.DoubleSide,roughness:.88,metalness:0});
 // Side-fed reel → upper guides → accumulator serpentine → splice head → exit.
 const points=[[-2.28,1.79,-.04],[-1.79,2.13,-.04],[-1.18,2.48,-.04],[-1.02,2.25,-.04],[-1.02,1.65,-.04],[-.93,1.17,-.04],[-.56,1.15,-.04],[-.48,1.68,-.04],[-.48,2.37,-.04],[-.2,2.48,-.04],[.12,2.5,-.04],[.5,2.59,-.04],[1.04,2.68,-.04],[1.45,2.84,-.04],[2.03,3.03,-.04],[2.69,3.1,-.04],[3.22,3.1,-.04]];
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)),false,'centripetal');const samples=200,pos=[],uv=[],idx=[];
 for(let i=0;i<=samples;i++){const p=curve.getPoint(i/samples);pos.push(p.x,p.y,p.z-.53,p.x,p.y,p.z+.53);uv.push(0,i/samples*3,1,i/samples*3);if(i<samples){const n=i*2;idx.push(n,n+1,n+2,n+1,n+3,n+2)}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();const paper=new T.Mesh(geo,mat);paper.receiveShadow=true;paper.castShadow=true;paper.userData.normalMaterial=mat;paper.userData.module=1;group.add(paper);
 const standby=new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(2.28,1.79,0),new T.Vector3(1.76,2.18,0),new T.Vector3(1.36,2.55,0)]),new T.LineDashedMaterial({color:0x9bbeb6,dashSize:.075,gapSize:.05,transparent:true,opacity:.6}));standby.computeLineDistances();group.add(standby);
 const rollers=[];machine.traverse(m=>{if(m.userData.reel||m.userData.roller)rollers.push(m)});
 let enabled=false;return {setVisible(value){enabled=value;group.visible=value},update(dt){if(!enabled)return;texture.offset.y=(texture.offset.y+dt*.18)%1;rollers.forEach(m=>m.rotateY(dt*(m.userData.reel?-.28:1.3)))}};
}
