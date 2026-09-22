import * as THREE from 'three';
import { sphereIntersection, tripleSphereIntersections, distance, smoothstep, clamp } from './geometry.js';

const centers = [[-2.6,1.45,-.5],[2.4,1.65,-.7],[.5,-1.4,2.8],[.1,3,-2.5]];
const target = [0,-.35,0];
const radii = centers.map(c=>distance(c,target));
const colorValues = ['#568aab','#ce8650','#7b9470','#9a79a7'];
const candidates = tripleSphereIntersections(centers[0],radii[0],centers[1],radii[1],centers[2],radii[2]).sort((a,b)=>distance(a,target)-distance(b,target));
function circlePoints(i,j){const c=sphereIntersection(centers[i],radii[i],centers[j],radii[j]);if(!c)return[];return Array.from({length:161},(_,n)=>{const a=n/160*Math.PI*2;return c.center.map((v,k)=>v+c.radius*(c.u[k]*Math.cos(a)+c.v[k]*Math.sin(a)));});}

export class Space {
  constructor(container){
    this.container=container;this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(34,1,.1,100);this.width=1000;this.height=680;this.fallback=false;
    this.spheres=[];this.intersections=[];
    try{this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));this.renderer.setClearColor(0x000000,0);container.append(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-hidden','true');}
    catch{this.fallback=true;document.querySelector('#graphics-warning').hidden=false;}
    const geometry=new THREE.SphereGeometry(1,64,40);
    for(let i=0;i<4;i++){
      const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.FrontSide,uniforms:{tint:{value:new THREE.Color(colorValues[i])},opacity:{value:.43}},vertexShader:`varying vec3 vNormal; varying vec3 vView; void main(){vec4 p=modelViewMatrix*vec4(position,1.0); vNormal=normalize(normalMatrix*normal); vView=normalize(-p.xyz); gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform vec3 tint; uniform float opacity; varying vec3 vNormal; varying vec3 vView; void main(){vec3 n=normalize(vNormal);float facing=abs(dot(n,normalize(vView)));float light=max(0.0,dot(n,normalize(vec3(-.65,.8,.9))));vec3 color=mix(tint*.8,vec3(.98,.96,.9),pow(light,3.0)*.77);float alpha=opacity*smoothstep(0.0,.23,facing)*(.76+.24*facing);gl_FragColor=vec4(color,alpha);}`});
      const mesh=new THREE.Mesh(geometry,material);mesh.position.fromArray(centers[i]);mesh.scale.setScalar(radii[i]);this.scene.add(mesh);this.spheres.push(mesh);
    }
    for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){
      const points=circlePoints(i,j);if(points.length<2)continue;
      const curve=new THREE.CatmullRomCurve3(points.slice(0,-1).map(p=>new THREE.Vector3(...p)),true,'centripetal');
      const material=new THREE.MeshBasicMaterial({color:i===0&&j===1?'#c08035':new THREE.Color(colorValues[i]).lerp(new THREE.Color(colorValues[j]),.5),transparent:true,opacity:1,depthTest:false});
      const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,160,i===0&&j===1?.031:.014,6,true),material);mesh.renderOrder=10;this.scene.add(mesh);this.intersections.push({i,j,mesh});
    }
    this.markerGeometry=new THREE.SphereGeometry(.058,16,12);this.markers=candidates.map((p,i)=>{const m=new THREE.Mesh(this.markerGeometry,new THREE.MeshBasicMaterial({color:i===0?'#365447':'#b66451',depthTest:false}));m.position.fromArray(p);m.renderOrder=20;this.scene.add(m);return m;});
  }
  resize(width,height){this.width=width;this.height=height;this.camera.aspect=width/height;this.camera.updateProjectionMatrix();if(this.renderer)this.renderer.setSize(width,height);}
  project(point){const v=new THREE.Vector3(...point).project(this.camera);const x=(v.x+1)/2*this.width,y=(1-v.y)/2*this.height;const scale=Math.min(this.width/1000,this.height/680);return {x:(x-(this.width-1000*scale)/2)/scale,y:(y-(this.height-680*scale)/2)/scale};}
  draw(chapter,t,globalTime){
    const count=Number(chapter.id.slice(-1));
    // Fixed framing avoids jumps between the four chapters; very slow orbital motion reveals depth.
    const angle=.48+Math.sin(globalTime*.013)*.14;
    const viewScale=Math.max(1,1.47/this.camera.aspect);
    this.camera.position.set(Math.sin(angle)*26.8*viewScale,5.2*viewScale,Math.cos(angle)*26.8*viewScale);this.camera.lookAt(0,1.1,0);this.camera.updateMatrixWorld();
    const reveal=smoothstep(clamp(t/3.2));const correction=count===4?.18*smoothstep(t/3)*(1-smoothstep((t-4)/6)):0;
    this.spheres.forEach((sphere,i)=>{sphere.visible=i<count;sphere.material.uniforms.opacity.value=(count>=3?.29:.41)*(i===count-1?reveal:1);sphere.scale.setScalar((radii[i]+correction)*(i===count-1?.12+.88*reveal:1));sphere.renderOrder=i;});
    this.intersections.forEach(({i,j,mesh})=>{mesh.visible=j<count;const revealLine=j===count-1?smoothstep(clamp((t-3.2)/1.8)):1;mesh.material.opacity=(count===2?.95:(i===0&&j===1?.8:.3))*revealLine*(count===4?smoothstep((t-10)/2):1);});
    this.markers.forEach((m,i)=>{m.visible=(count===3&&t>3.2)||(count===4&&i===0&&t>10);});
    if(this.renderer)this.renderer.render(this.scene,this.camera);
    const spheres=centers.map((c,i)=>{const p=this.project(c),edge=this.project([c[0]+radii[i],c[1],c[2]]);return {...p,r:Math.abs(edge.x-p.x)};});
    return {satellites:centers.map(c=>this.project(c)),spheres,candidates:candidates.map(c=>this.project(c)),circle:circlePoints(0,1).map(p=>this.project(p)),fallback:this.fallback};
  }
}
