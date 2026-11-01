import { SPACE_SATS, SPACE_RADII } from './geometry.js';

const vertex = `attribute vec2 position; varying vec2 uv; void main(){ uv=position; gl_Position=vec4(position,0.,1.); }`;
// Analytic ray/sphere intersections, both surfaces in depth order. Intersection
// highlights follow distances to the OTHER sphere surfaces, not overlapping discs.
const fragment = `precision highp float;
varying vec2 uv;
uniform vec2 resolution;
uniform vec3 eye, forward, right, up;
uniform vec4 spheres[4];
uniform vec3 colors[4];
uniform float amounts[4];
void main(){
 vec3 ray=normalize(forward + right*uv.x*(resolution.x/resolution.y)/2.84 + up*uv.y/2.84);
 float depths[8]; float owners[8];
 for(int i=0;i<4;i++){
   vec3 oc=eye-spheres[i].xyz;
   float b=dot(oc,ray), d=b*b-dot(oc,oc)+spheres[i].w*spheres[i].w;
   float root=sqrt(max(0.,d));
   depths[i*2]=d>0. && amounts[i]>.001 ? -b-root : 1000.;
   depths[i*2+1]=d>0. && amounts[i]>.001 ? -b+root : 1000.;
   owners[i*2]=float(i); owners[i*2+1]=float(i);
 }
 for(int i=0;i<8;i++) for(int j=0;j<7;j++){
   if(depths[j]>depths[j+1]){float t=depths[j];depths[j]=depths[j+1];depths[j+1]=t;t=owners[j];owners[j]=owners[j+1];owners[j+1]=t;}
 }
 vec3 result=vec3(0.); float alpha=0.;
 for(int k=0;k<8;k++){
   float depth=depths[k];
   if(depth>0. && depth<999.){
     vec3 p=eye+ray*depth; vec3 center=vec3(0.);vec3 color=vec3(0.);float radius=1.;float amount=0.;
     for(int i=0;i<4;i++) if(abs(owners[k]-float(i))<.1){center=spheres[i].xyz;radius=spheres[i].w;color=colors[i];amount=amounts[i];}
     vec3 n=(p-center)/radius;
     float light=.5+.5*abs(dot(n,normalize(vec3(-.5,1.,2.))));
     float intersection=0.;vec3 mixed=color;
     for(int j=0;j<4;j++) if(abs(owners[k]-float(j))>.1){
       float edge=abs(length(p-spheres[j].xyz)-spheres[j].w);
       float line=(1.-smoothstep(.006,.023,edge))*amounts[j];
       intersection=max(intersection,line);mixed=mix(mixed,(color+colors[j])*.36,line);
     }
     float a=mix(.105+.055*(1.-abs(dot(n,ray))),.62,intersection)*amount;
     float highlight=pow(max(0.,dot(n,normalize(vec3(-.5,1.,2.)))),5.);
     vec3 shade=mix(color*(.55+.45*light),vec3(.96,.95,.92),highlight*.7);
     shade=mix(shade,mixed,intersection);
     result+=(1.-alpha)*shade*a;alpha+=(1.-alpha)*a;
   }
 }
 gl_FragColor=vec4(alpha>0. ? result/alpha : vec3(0.),alpha);
}`;

export class SphereRenderer {
  constructor(canvas) {
    this.canvas=canvas;
    this.gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
    this.available=false;
    if(!this.gl) return;
    const gl=this.gl;
    try {
      const compile=(type,source)=>{
        const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
        return shader;
      };
      this.program=gl.createProgram();gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);
      if(!gl.getProgramParameter(this.program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.program));
      gl.useProgram(this.program);
      const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(this.program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      this.locations={};['resolution','eye','forward','right','up','spheres[0]','colors[0]','amounts[0]'].forEach(name=>this.locations[name]=gl.getUniformLocation(this.program,name));
      gl.uniform3fv(this.locations['colors[0]'],new Float32Array([.25,.53,.61,.72,.53,.25,.75,.43,.37,.46,.58,.37]));
      this.available=true;
    } catch(error) {
      // The canvas renderer provides a complete illustrated fallback.
      this.failure=error.message;
    }
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();this.available=false;});
  }
  render(camera,amounts,bias=0) {
    if(!this.available) return false;
    const gl=this.gl;
    gl.viewport(0,0,this.canvas.width,this.canvas.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.uniform2f(this.locations.resolution,this.canvas.width,this.canvas.height);
    ['eye','forward','right','up'].forEach(key=>gl.uniform3fv(this.locations[key],camera[key]));
    gl.uniform4fv(this.locations['spheres[0]'],new Float32Array(SPACE_SATS.flatMap((s,i)=>[...s,SPACE_RADII[i]+bias])));
    gl.uniform1fv(this.locations['amounts[0]'],new Float32Array(amounts));
    gl.drawArrays(gl.TRIANGLES,0,6);
    return true;
  }
}
