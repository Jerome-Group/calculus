import { parse, type MathNode } from 'mathjs';
export type Vec = [number,number,number];
export type GraphSpec = {mode:'surface'|'parametric'|'curve'|'implicit';expressions:string[];min:number;max:number;vmin:number;vmax:number;clip:number;a:number};
const functions=new Set(['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','sqrt','cbrt','abs','exp','log','log10','floor','ceil','round','sign','min','max','pow']);
const symbols=new Set(['x','y','z','u','v','t','a','pi','e']);
export function expression(source:string,allowedVars?:Set<string>){
 if(!source.trim()||source.length>400) throw new Error('Enter an expression of 1–400 characters.');
 const node=parse(source); let count=0;
 node.traverse((n:MathNode,path:string,parent:MathNode|null)=>{if(++count>160)throw new Error('This expression is too complex. Try a smaller expression.');
  if(!['OperatorNode','ConstantNode','SymbolNode','ParenthesisNode','FunctionNode','ConditionalNode'].includes(n.type))throw new Error('Use numbers, variables and mathematical functions only.');
  if(n.type==='SymbolNode'&&functions.has((n as any).name)&&!(parent?.type==='FunctionNode'&&(parent as any).fn===n))throw new Error('Use '+(n as any).name+' with parentheses and an argument.');
  if(n.type==='SymbolNode'&&allowedVars&&symbols.has((n as any).name)&&!allowedVars.has((n as any).name)&&!['pi','e'].includes((n as any).name))throw new Error('Variable '+(n as any).name+' is not available in this representation.');
  if(n.type==='SymbolNode'&&!symbols.has((n as any).name)&&!functions.has((n as any).name))throw new Error('Unknown symbol: '+(n as any).name);
  if(n.type==='FunctionNode'){const fn=(n as any).fn.name,args=(n as any).args.length;if(!functions.has(fn))throw new Error('Unsupported function.');const valid=fn==='min'||fn==='max'?args>=1:fn==='pow'||fn==='atan2'?args===2:fn==='log'||fn==='round'?args>=1&&args<=2:args===1;if(!valid)throw new Error('Wrong number of arguments to '+fn+'.');}
  if(n.type==='OperatorNode'&&!['+','-','*','/','^','%','<','>','<=','>=','==','!=','and','or','not'].includes((n as any).op))throw new Error('Unsupported operator.');
 });
 if(node.type==='SymbolNode'&&functions.has((node as any).name))throw new Error('Call the function with parentheses and an argument.');
 const code=node.compile(); return (scope:Record<string,number>)=>{try{const r=code.evaluate(scope);return typeof r==='number'&&Number.isFinite(r)?r:NaN;}catch{return NaN;}};
}
export function validateGraph(g:GraphSpec){
 if(!['surface','parametric','curve','implicit'].includes(g.mode))throw new Error('Unknown representation.');
 const needed=g.mode==='parametric'||g.mode==='curve'?3:1;
 if(![g.min,g.max,g.vmin,g.vmax,g.clip,g.a].every(Number.isFinite))throw new Error('All bounds and parameters must be finite numbers.');
 if(g.min>=g.max||g.vmin>=g.vmax)throw new Error('Each lower bound must be smaller than its upper bound.');
 if(Math.max(Math.abs(g.min),Math.abs(g.max),Math.abs(g.vmin),Math.abs(g.vmax))>1000||g.clip<=0||g.clip>1000)throw new Error('Use bounds within −1000 to 1000 and a positive clipping height up to 1000.');
 if(g.expressions.length!==needed||g.expressions.some(e=>typeof e!=='string'||!e.trim()))throw new Error('Enter '+needed+' nonempty expression'+(needed>1?'s':'')+'.');
 const allowed=new Set((g.mode==='surface'?['x','y']:g.mode==='parametric'?['u','v']:g.mode==='curve'?['t']:['x','y','z']).concat('a'));
 return g.expressions.map(e=>expression(e,allowed));
}
export const initialGraph:GraphSpec={mode:'surface',expressions:['sin(sqrt(x^2+y^2))'],min:-5,max:5,vmin:-5,vmax:5,clip:5,a:1};
export const add=(a:Vec,b:Vec):Vec=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const scale=(a:Vec,s:number):Vec=>a.map(v=>v*s) as Vec;
