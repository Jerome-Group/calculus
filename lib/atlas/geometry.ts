import * as T from 'three';
import { type Vec, type GraphSpec, validateGraph } from './math';
export const C={surface:0x547cf2,accent:0xf28743,blue:0x8a74cd,pink:0xd64e79,muted:0x8e9eb9};
export function builder(group:T.Group){
 const line=(pts:Vec[],color=C.accent,width=1)=>{const geo=new T.BufferGeometry().setFromPoints(pts.filter(p=>p.every(Number.isFinite)).map(p=>new T.Vector3(...p))); const l=new T.Line(geo,new T.LineBasicMaterial({color,linewidth:width}));group.add(l);return l;};
 const curve=(fn:(t:number)=>Vec,a=0,b=Math.PI*2,color=C.accent,n=120)=>line(Array.from({length:n+1},(_,i)=>fn(a+(b-a)*i/n)),color);
 const dot=(p:Vec,color=C.accent,size=.065)=>{const m=new T.Mesh(new T.SphereGeometry(size,16,12),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.25}));m.position.set(...p);group.add(m);};
 const arrow=(p:Vec,v:Vec,color=C.accent)=>{const d=new T.Vector3(...v);const len=d.length();if(len<1e-8)return;group.add(new T.ArrowHelper(d.normalize(),new T.Vector3(...p),len,color,Math.min(.16,len*.3),Math.min(.085,len*.15)));};
 const mesh=(fn:(u:number,v:number)=>Vec,umin:number,umax:number,vmin:number,vmax:number,color=C.surface,opacity=.68,n=40,m=n,clip=Infinity)=>{
 if(group.userData.lowQuality){n=Math.min(n,24);m=Math.min(m,28);}
 const points:Vec[]=[]; const valid:boolean[]=[];for(let i=0;i<=n;i++)for(let j=0;j<=m;j++){const p=fn(umin+(umax-umin)*i/n,vmin+(vmax-vmin)*j/m);points.push(p);valid.push(p.every(v=>Number.isFinite(v)&&Math.abs(v)<1e12)&&Math.abs(p[2])<=clip);}
 const pos:number[]=[]; const indices:number[]=[];for(const p of points)pos.push(...p.map(v=>Number.isFinite(v)?v:0));
 const tri=(a:number,b:number,c:number)=>{if(valid[a]&&valid[b]&&valid[c]&&(clip===Infinity||Math.max(points[a][2],points[b][2],points[c][2])-Math.min(points[a][2],points[b][2],points[c][2])<clip*.65))indices.push(a,b,c);};
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){const a=i*(m+1)+j;tri(a,a+m+1,a+1);tri(a+1,a+m+1,a+m+2);}
 const compact:number[]=[];for(const i of indices)compact.push(...points[i]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(compact,3));geo.computeVertexNormals();const mat=new T.MeshStandardMaterial({color,transparent:opacity<1,opacity,side:T.DoubleSide,roughness:.55,metalness:.15,depthWrite:opacity>.8});const s=new T.Mesh(geo,mat);group.add(s);
 const wire=new T.LineSegments(new T.WireframeGeometry(geo),new T.LineBasicMaterial({color,transparent:true,opacity:.15}));group.add(wire);return {mesh:s,valid:valid.filter(Boolean).length,total:valid.length,triangles:indices.length/3};
 };
 const sphere=(r:number,color=C.surface,opacity=.35,cap=Math.PI)=>mesh((u,v)=>[r*Math.sin(u)*Math.cos(v),r*Math.sin(u)*Math.sin(v),r*Math.cos(u)],0,cap,0,2*Math.PI,color,opacity,28,48);
 const disk=(r:number,z=0,color=C.blue,opacity=.4,theta=Math.PI*2)=>mesh((u,v)=>[u*Math.cos(v),u*Math.sin(v),z],0,r,0,theta,color,opacity,10,48);
 const field=(fn:(x:number,y:number,z:number)=>Vec,three=false)=>{for(let x=-2;x<=2;x+=.8)for(let y=-2;y<=2;y+=.8)for(const z of three?[-1,0,1]:[0]){const v=fn(x,y,z);const len=Math.hypot(...v);if(len)arrow([x,y,z],v.map(e=>e*.4/(1+len*.4)) as Vec,C.blue);}};
 const box=(p:Vec,w:number,d:number,h:number,color=C.surface)=>{const geo=new T.BoxGeometry(w,d,h);const s=new T.Mesh(geo,new T.MeshStandardMaterial({color,transparent:true,opacity:.8,roughness:.6}));s.position.set(p[0],p[1],p[2]+h/2);group.add(s);const e=new T.LineSegments(new T.EdgesGeometry(geo),new T.LineBasicMaterial({color:0x3954a3}));e.position.copy(s.position);group.add(e);};
 return {line,curve,dot,arrow,mesh,sphere,disk,field,box};
}
export function buildScene(id:string,p:number,g:T.Group){
 const {line,curve,dot,arrow,mesh,sphere,disk,field,box}=builder(g); const pi=Math.PI;
 const bowl=()=>mesh((x,y)=>[x,y,x*x+y*y],-2.2,2.2,-2.2,2.2);
 const circle=(r=1,z=0,color=C.accent,end=2*pi)=>curve(t=>[r*Math.cos(t),r*Math.sin(t),z],0,end,color);
 const cap=(R:number,a:number)=>sphere(R,C.surface,.5,a);
 switch(id){
 case 'curves':case 'arc':{const start=id==='arc'?0:-pi,end=id==='arc'?2*pi:pi;curve(t=>[Math.cos(t),Math.sin(t),t],start,end,C.surface);if(id==='arc')curve(t=>[Math.cos(t),Math.sin(t),t],0,p,C.accent);const q:Vec=[Math.cos(p),Math.sin(p),p];dot(q);arrow(q,[-Math.sin(p),Math.cos(p),1]);line([[q[0],q[1],0],q],C.muted);break;}
 case 'surface':bowl();circle(Math.sqrt(p),p);circle(Math.sqrt(p),0,C.blue);break;
 case 'limits':mesh((x,y)=>[x,y,x===0&&y===0?NaN:x*y/(x*x+y*y)],-2,2,-2,2);{const z=Math.sin(p)*Math.cos(p);curve(r=>[r*Math.cos(p),r*Math.sin(p),z],.03,2,C.accent);line([[0,0,0],[2*Math.cos(p),2*Math.sin(p),0]],C.blue);dot([.06*Math.cos(p),.06*Math.sin(p),z]);}break;
 case 'hiddenpath':mesh((x,y)=>[x,y,x===0&&y===0?NaN:x*x*y/(x**4+y*y)],-1.7,1.7,-1.7,1.7);curve(x=>[x,p*x*x,p/(1+p*p)],.025,Math.min(1.25,Math.sqrt(1.6/(Math.abs(p)||1))),C.accent);curve(x=>[x,p*x*x,0],0,1.2,C.blue);break;
 case 'partial':bowl();curve(x=>[x,p,x*x+p*p],-1.65,1.65);line([[-1.65,p,0],[1.65,p,0]],C.blue);dot([1,p,1+p*p]);line([[.5,p,p*p],[1.5,p,2+p*p]],C.pink);break;
 case 'tangent':case 'taylor':mesh((r,t)=>{const x=1+r*Math.cos(t),y=1+r*Math.sin(t);return [x,y,x*x+y*y]},0,p,0,2*pi,C.surface,.62,12,48);mesh((r,t)=>{const x=1+r*Math.cos(t),y=1+r*Math.sin(t);return [x,y,2*x+2*y-2]},0,p,0,2*pi,C.blue,.45,12,48);dot([1,1,2],C.pink);circleAround();break;
 case 'differential':mesh((x,y)=>[x,y,x===0&&y===0?0:x**3/(x*x+y*y)],-2,2,-2,2);mesh((x,y)=>[x,y,x],-1.2,1.2,-1.2,1.2,C.blue,.25,12);curve(r=>[r*Math.cos(p),r*Math.sin(p),r*Math.cos(p)**3],-2,2,C.accent);break;
 case 'extrema':mesh((x,y)=>[x,y,x*x+p*y*y],-1.6,1.6,-1.6,1.6);curve(x=>[x,0,x*x],-1.6,1.6,C.accent);curve(y=>[0,y,p*y*y],-1.6,1.6,C.blue);dot([0,0,0]);break;
 case 'directional':case 'gradient':bowl();circle(Math.SQRT2,2,C.accent);arrow([1,1,2],[-.6,-.6,.3],C.blue);dot([1,1,2]);arrow([1,1,2],[Math.cos(p)*.7,Math.sin(p)*.7,.7*(2*Math.cos(p)+2*Math.sin(p))],C.accent);arrow([1,1,0],[.8,.8,0],C.pink);arrow([1,1,0],[Math.cos(p),Math.sin(p),0],C.accent);break;
 case 'chain':bowl();arrow([Math.cos(p),Math.sin(p),0],[Math.cos(p),Math.sin(p),0],C.pink);arrow([Math.cos(p),Math.sin(p),0],[-Math.sin(p),Math.cos(p),0],C.blue);circle(1,1);dot([Math.cos(p),Math.sin(p),1]);arrow([Math.cos(p),Math.sin(p),1],[-Math.sin(p),Math.cos(p),0]);break;
 case 'lagrange':circle();mesh((x,y)=>[x,y,x+y],-1.3,1.3,-1.3,1.3,C.surface,.4,20);curve(t=>[Math.cos(t),Math.sin(t),Math.cos(t)+Math.sin(t)]);{const x=Math.cos(p),y=Math.sin(p);dot([x,y,x+y]);line([[x,y,0],[x,y,x+y]]);arrow([x,y,0],[.6,.6,0],C.pink);arrow([x,y,0],[x*.8,y*.8,0],C.blue);}break;
 case 'constraintSphere':sphere(1);{const q:Vec=[Math.sin(p)/Math.SQRT2,Math.sin(p)/Math.SQRT2,Math.cos(p)];dot(q);arrow(q,[.6,.6,.6]);}break;
 case 'constraintTwo':sphere(1);arrow([Math.cos(p),Math.sin(p),0],[Math.cos(p),Math.sin(p),0],C.blue);arrow([Math.cos(p),Math.sin(p),0],[0,0,1],C.accent);disk(1.3,0,C.blue,.25);circle();dot([Math.cos(p),Math.sin(p),0]);arrow([Math.cos(p),Math.sin(p),0],[.6,.6,0],C.pink);break;
 case 'riemann':{const n=Math.round(p),w=2/n;for(let i=0;i<n;i++)for(let j=0;j<n;j++){const x=-1+(i+.5)*w,y=-1+(j+.5)*w;box([x,y,0],w,w,3-(x*x+y*y)/2);}mesh((x,y)=>[x,y,3-(x*x+y*y)/2],-1,1,-1,1,C.accent,.25,24);}break;
 case 'double':mesh((u,v)=>[u,(2-u)*v,1+u+(2-u)*v],0,2,0,1);mesh((u,v)=>[u,(2-u)*v,0],0,2,0,1,C.blue,.25);mesh((y,z)=>[p,y,z*(1+p+y)],0,2-p,0,1,C.accent,.7,20);line([[0,0,0],[2,0,0],[0,2,0],[0,0,0]],C.blue);break;
 case 'polar':disk(2,0,C.surface,.6,p);for(let r=.5;r<=2;r+=.5)circle(r,.005,C.blue,p);for(let t=0;t<=p;t+=.25)line([[0,0,.01],[2*Math.cos(t),2*Math.sin(t),.01]],C.blue);arrow([0,0,0],[2*Math.cos(p),2*Math.sin(p),0]);break;
 case 'triple':mesh((r,t)=>[r*Math.cos(t),r*Math.sin(t),2-r*r],0,Math.SQRT2,0,2*pi);disk(Math.SQRT2,0,C.blue,.3);disk(Math.sqrt(2-p),p,C.accent,.75);circle(Math.sqrt(2-p),p);break;
 case 'cylindrical':mesh((t,z)=>[Math.cos(t),Math.sin(t),z],0,p,0,2,C.surface,.5);disk(1,0,C.blue,.3,p);disk(1,2,C.blue,.3,p);for(const t of [0,p])mesh((r,z)=>[r*Math.cos(t),r*Math.sin(t),z],0,1,0,2,C.accent,.4,12);arrow([0,0,0],[0,0,2],C.accent);break;
 case 'spherical':cap(2,p);mesh((r,t)=>[r*Math.sin(p)*Math.cos(t),r*Math.sin(p)*Math.sin(t),r*Math.cos(p)],0,2,0,2*pi,C.blue,.25,15,40);circle(2*Math.sin(p),2*Math.cos(p));line([[0,0,0],[2*Math.sin(p),0,2*Math.cos(p)]],C.accent);break;
 case 'jacobian':line([[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,0]],C.blue);mesh((u,v)=>[(1+p)*u+p*v,p*u+(1+p)*v,.04],0,1,0,1,C.surface,.55,10);arrow([0,0,.06],[1+p,p,0]);arrow([0,0,.06],[p,1+p,0],C.pink);break;
 case 'lineScalar':circle(1,0,C.blue);mesh((t,s)=>[Math.cos(t),Math.sin(t),s*(2+Math.cos(t))],0,p,0,1,C.surface,.65,64,6);curve(t=>[Math.cos(t),Math.sin(t),2+Math.cos(t)],0,p);dot([Math.cos(p),Math.sin(p),0]);break;
 case 'lineintegral':field((x,y)=>[-y,x,0]);circle(1,0,C.surface);circle(1,.02,C.accent,p);dot([Math.cos(p),Math.sin(p),.02]);arrow([Math.cos(p),Math.sin(p),.02],[-Math.sin(p)*.6,Math.cos(p)*.6,0],C.pink);break;
 case 'field':field((x,y,z)=>[-(1-p)*y+p*x,(1-p)*x+p*y,p*z],true);circle(1,0,C.surface);break;
 case 'conservative':field((x,y,z)=>[2*x,2*y,2*z]);curve(t=>[t,t*t,.02],0,1,C.surface);curve(t=>[t,t*t,.04],0,p,C.accent);line([[0,0,0],[1,1,0]],C.pink);dot([p,p*p,.04]);break;
 case 'green':disk(1,0,C.surface,.4);field((x,y)=>[-y/2,x/2,0]);circle(1,.03,C.blue);circle(1,.04,C.accent,p);arrow([Math.cos(p),Math.sin(p),.04],[-Math.sin(p)*.5,Math.cos(p)*.5,0]);break;
 case 'parametric':sphere(2);{const v=.7;const q:Vec=[2*Math.sin(p)*Math.cos(v),2*Math.sin(p)*Math.sin(v),2*Math.cos(p)];curve(u=>[2*Math.sin(u)*Math.cos(v),2*Math.sin(u)*Math.sin(v),2*Math.cos(u)],0,pi,C.blue);circle(2*Math.sin(p),2*Math.cos(p));dot(q);arrow(q,[2*Math.cos(p)*Math.cos(v),2*Math.cos(p)*Math.sin(v),-2*Math.sin(p)],C.pink);arrow(q,[-2*Math.sin(p)*Math.sin(v),2*Math.sin(p)*Math.cos(v),0],C.accent);arrow(q,q.map(x=>x*.5) as Vec,C.blue);}break;
 case 'flux':cap(2,p);circle(2*Math.sin(p),2*Math.cos(p));for(let u=.3;u<p;u+=.5)for(let v=0;v<2*pi;v+=.8){const q:Vec=[2*Math.sin(u)*Math.cos(v),2*Math.sin(u)*Math.sin(v),2*Math.cos(u)];arrow(q,q.map(x=>x*.25) as Vec,C.blue);}break;
 case 'stokes':mesh((r,t)=>[r*Math.cos(t),r*Math.sin(t),p*(1-r*r)],0,1,0,2*pi);circle(1,0);arrow([1,0,0],[0,.6,0]);for(const [x,y] of [[0,0],[.5,0],[0,.5],[-.5,0],[0,-.5]])arrow([x,y,p*(1-x*x-y*y)],[p*x*.5,p*y*.5,.25],C.blue);break;
 case 'divergence':sphere(p);disk(p,0,C.blue,.3);for(let u=.4;u<pi;u+=.65)for(let v=0;v<2*pi;v+=1){const q:Vec=[p*Math.sin(u)*Math.cos(v),p*Math.sin(u)*Math.sin(v),p*Math.cos(u)];arrow(q,q.map(x=>x*.35) as Vec,C.blue);}break;

 case 'vectors':{const v:Vec=[Math.cos(p),Math.sin(p),0];arrow([0,0,0],[1,0,0],C.blue);arrow([0,0,0],v,C.accent);arrow([0,0,0],[1+v[0],v[1],0],C.surface);line([[1,0,0],[1+v[0],v[1],0],v],C.muted);curve(t=>[.35*Math.cos(t),.35*Math.sin(t),0],0,p,C.pink);break;}
 case 'elementarycurves':case 'curveCycloid':{curve(t=>[t-Math.sin(t),1-Math.cos(t),0],0,2*pi,C.surface);curve(t=>[p+Math.cos(t),1+Math.sin(t),0],0,2*pi,C.blue);dot([p-Math.sin(p),1-Math.cos(p),0]);arrow([p-Math.sin(p),1-Math.cos(p),0],[1-Math.cos(p),Math.sin(p),0]);line([[0,0,0],[2*pi,0,0]],C.muted);break;}
 case 'curveCircle':case 'curveEllipse':{const a=id==='curveEllipse'?2:1;curve(t=>[a*Math.cos(t),Math.sin(t),0],0,2*pi,C.surface);dot([a*Math.cos(p),Math.sin(p),0]);arrow([a*Math.cos(p),Math.sin(p),0],[-a*Math.sin(p),Math.cos(p),0]);break;}
 case 'curveCusp':curve(t=>[t*t*t,t*t,0],-1,1,C.surface);dot([p*p*p,p*p,0]);arrow([p*p*p,p*p,0],[3*p*p,2*p,0]);break;
 case 'curveLine':line([[-2,0,0],[2,0,0]],C.surface);dot([p,0,0]);arrow([p,0,0],[1,0,0]);break;
 case 'topology':disk(1,0,C.surface,.35);circle(1,0,C.surface);curve(t=>[p+.25*Math.cos(t),.25*Math.sin(t),.02],0,2*pi,C.accent);dot([p,0,.03]);line([[0,0,0],[p,0,0]],C.blue);break;
 case 'epsilon':bowl();disk(Math.sqrt(p),0,C.blue,.5);disk(Math.sqrt(p),p,C.accent,.3);circle(Math.sqrt(p),p);line([[0,0,0],[0,0,p]],C.accent);break;
 case 'squeeze':mesh((x,y)=>[x,y,x===0&&y===0?0:3*x*x*y/(x*x+y*y)],-1.4,1.4,-1.4,1.4);disk(p,3*p,C.blue,.2);disk(p,-3*p,C.blue,.2);curve(t=>[p*Math.cos(t),p*Math.sin(t),3*p*Math.cos(t)**2*Math.sin(t)],0,2*pi,C.accent);break;
 case 'infinity':mesh((r,t)=>[r*Math.cos(t),r*Math.sin(t),Math.cos(t)/r],p,5,0,2*pi);circle(p,0,C.accent);disk(5,1/p,C.blue,.1);disk(5,-1/p,C.blue,.1);break;
 case 'cross':bowl();{const q:Vec=[1,1,2];const sign=p<0?-1:1;mesh((u,v)=>[1+u,1+v,2+2*u+2*v],-.6,.6,-.6,.6,C.blue,.3,8);arrow(q,[.7,0,1.4],C.accent);arrow(q,[0,.7,1.4],C.pink);arrow(q,[-.7*sign,-.7*sign,.35*sign],C.blue);}break;
 case 'implicit':sphere(1);{const q:Vec=[Math.sin(p),0,Math.cos(p)];dot(q);arrow(q,q.map(x=>x*.7) as Vec,C.blue);mesh((u,v)=>[q[0]+u*Math.cos(p),v,q[2]-u*Math.sin(p)],-.6,.6,-.6,.6,C.accent,.4,12);line([[q[0],0,0],q],C.pink);}break;
 case 'mixed':mesh((x,y)=>[x,y,x*x*y],-1.5,1.5,-1.5,1.5);curve(x=>[x,p,x*x*p],-1.5,1.5,C.accent);dot([1,p,p]);line([[.6,p,p-.8*p],[1.4,p,p+.8*p]],C.pink);break;
 case 'global':mesh((x,y)=>[x,y,x*x-2*x*y+2*y],0,3,0,2);for(const [a,b]of [[[0,0],[3,0]],[[3,0],[3,2]],[[3,2],[0,2]],[[0,2],[0,0]]] as any){curve(t=>{const x=a[0]+t*(b[0]-a[0]),y=a[1]+t*(b[1]-a[1]);return [x,y,x*x-2*x*y+2*y]},0,1,C.blue);}for(const q of [[0,0,0],[2,2,0],[3,0,9],[1,1,1]] as Vec[])dot(q,C.pink);{const t=p%4;let x=0,y=0;if(t<1)x=3*t;else if(t<2){x=3;y=2*(t-1);}else if(t<3){x=3*(3-t);y=2;}else y=2*(4-t);dot([x,y,x*x-2*x*y+2*y],C.accent,.1);}break;
 case 'vortex':field((x,y)=>{const r=x*x+y*y;return r<.05?[0,0,0]:[-y/r,x/r,0]});circle(1,0,C.surface);circle(1,.03,C.accent,p);dot([0,0,0],C.pink,.1);break;
 case 'mobius':mesh((u,v)=>[(1+v*Math.cos(u/2))*Math.cos(u),(1+v*Math.cos(u/2))*Math.sin(u),v*Math.sin(u/2)],0,2*pi,-.35,.35,C.surface,.8,80,12);{const q:Vec=[Math.cos(p),Math.sin(p),0];dot(q);arrow(q,[Math.sin(p/2)*Math.cos(p),Math.sin(p/2)*Math.sin(p),-Math.cos(p/2)],C.accent);circle(1,0,C.blue);}break;
 default:throw new Error('Scene not implemented: '+id);
 }
 function circleAround(){mesh((a,r)=>[1+r*Math.cos(a),1+r*Math.sin(a),2+2*r*(Math.cos(a)+Math.sin(a))],0,2*pi,0,p,C.blue,.15,40,8);const x=1+p/Math.SQRT2,y=x;dot([x,y,x*x+y*y]);line([[x,y,2*x+2*y-2],[x,y,x*x+y*y]],C.accent);}
 return '';
}
export function buildGraph(spec:GraphSpec,g:T.Group){
 const fs=validateGraph(spec),{mesh,curve}=builder(g);const base={a:spec.a,x:0,y:0,z:0,u:0,v:0,t:0};
 if(spec.mode==='surface'){const r=mesh((x,y)=>[x,y,fs[0]({...base,x,y})],spec.min,spec.max,spec.vmin,spec.vmax,C.surface,.85,64,64,spec.clip);return `${r.valid}/${r.total} finite samples in the clipping range · ${r.triangles} mesh triangles`;}
 if(spec.mode==='parametric'){const r=mesh((u,v)=>fs.map(fn=>fn({...base,u,v})) as Vec,spec.min,spec.max,spec.vmin,spec.vmax,C.surface,.8,56,56,spec.clip);return `${r.valid}/${r.total} finite parameter samples · ${r.triangles} triangles`;}
 if(spec.mode==='curve'){let pts:Vec[]=[];let valid=0;for(let i=0;i<=600;i++){const t=spec.min+(spec.max-spec.min)*i/600;const p=fs.map(fn=>fn({...base,t})) as Vec;if(p.every(Number.isFinite)&&Math.abs(p[2])<=spec.clip){pts.push(p);valid++;}else {if(pts.length>1)builder(g).line(pts,C.surface);pts=[];}}if(pts.length>1)builder(g).line(pts,C.surface);return `${valid}/601 finite curve samples in the clipping range`;}
 // Marching tetrahedra on a bounded cubic grid. Zero crossings are linearly interpolated.
 const n=24,pts:Vec[]=[],values:number[]=[],pos:number[]=[];let finite=0;
 for(let i=0;i<=n;i++)for(let j=0;j<=n;j++)for(let k=0;k<=n;k++){const x=spec.min+(spec.max-spec.min)*i/n,y=spec.vmin+(spec.vmax-spec.vmin)*j/n,z=-spec.clip+2*spec.clip*k/n;pts.push([x,y,z]);const q=fs[0]({...base,x,y,z});values.push(q);if(Number.isFinite(q))finite++;}
 const idx=(i:number,j:number,k:number)=>(i*(n+1)+j)*(n+1)+k;
 const edges=new Map<string,Vec|null>();
 const root=(ia:number,ib:number):Vec|null=>{const key=ia<ib?ia+','+ib:ib+','+ia;if(edges.has(key))return edges.get(key)!;let lo=pts[ia],hi=pts[ib],fl=values[ia],fh=values[ib];const tolerance=1e-6*(1+Math.min(Math.abs(fl),Math.abs(fh)));let result:Vec|null=null;for(let iteration=0;iteration<18;iteration++){const ratio=iteration%3===2?.5:Math.max(.02,Math.min(.98,fl/(fl-fh)));const q=lo.map((v,d)=>v+ratio*(hi[d]-v)) as Vec;const fq=fs[0]({...base,x:q[0],y:q[1],z:q[2]});if(!Number.isFinite(fq))break;if(Math.abs(fq)<=tolerance){result=q;break;}if((fq<0)===(fl<0)){lo=q;fl=fq;}else{hi=q;fh=fq;}}edges.set(key,result);return result;};
 const tetra=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
 for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++){
 const cube=[idx(i,j,k),idx(i+1,j,k),idx(i+1,j+1,k),idx(i,j+1,k),idx(i,j,k+1),idx(i+1,j,k+1),idx(i+1,j+1,k+1),idx(i,j+1,k+1)];
 for(const tet of tetra){const ids=tet.map(t=>cube[t]);if(ids.some(t=>!Number.isFinite(values[t])))continue;const ins=ids.filter(t=>values[t]<0),outs=ids.filter(t=>values[t]>=0);if(!ins.length||!outs.length)continue;const cross=(a:number,b:number)=>root(a,b);if(ins.length===1||outs.length===1){const single=ins.length===1?ins[0]:outs[0];const other=ins.length===1?outs:ins;const vs=other.map(v=>cross(single,v));if(vs.every(Boolean))for(const v of vs)pos.push(...v!);}else{const a=cross(ins[0],outs[0]),b=cross(ins[0],outs[1]),c=cross(ins[1],outs[0]),d=cross(ins[1],outs[1]);if(a&&b&&c)pos.push(...a,...b,...c);if(b&&c&&d)pos.push(...b,...d,...c);}}

 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();g.add(new T.Mesh(geo,new T.MeshStandardMaterial({color:C.surface,side:T.DoubleSide,roughness:.55,metalness:.1})));return `${pos.length/9} approximate zero-set triangles · ${finite}/${values.length} finite grid samples`;
}
