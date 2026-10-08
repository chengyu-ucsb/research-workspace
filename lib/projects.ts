import { z } from 'zod';
export const PHASES = [
 {id:'ideation',name:'Ideation',short:'Shape the question',description:'Develop the research question, literature, and contribution.',color:'#875bb1',steps:['Research question','Literature review','Study design']},
 {id:'access',name:'Access',short:'Set the study in motion',description:'Secure partnerships, permissions, ethics approval, and funding.',color:'#b27616',steps:['Partner outreach','Permissions / access','IRB preparation','IRB review','Grant review']},
 {id:'collection',name:'Data collection',short:'Build the evidence',description:'Pilot the design, recruit, and gather research materials.',color:'#197c83',steps:['Pilot study','Recruitment','Collecting data','Collection complete']},
 {id:'analysis',name:'Analysis',short:'Make sense of the data',description:'Prepare data, code or model, and develop the findings.',color:'#4666b8',steps:['Data preparation','Coding / modeling','Interpreting findings','Analysis complete']},
 {id:'writing',name:'Writing',short:'Develop the manuscript',description:'Draft the paper and work through feedback with collaborators.',color:'#be3e52',steps:['Outline','Theory / literature','Methods / findings','Discussion','Full draft','Coauthor feedback','Revising draft']},
 {id:'publication',name:'Publication',short:'Bring the work into print',description:'Submit, track reviews, revise, and record acceptance.',color:'#3c7959',steps:['Journal selection','Preparing submission','Under review','Revise & resubmit','Accepted','In press','Published']},
] as const;
export type Phase = typeof PHASES[number]['id'];
const date = z.string().refine(v=>v==='' || (/^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0,10)===v),'Use a valid date.');
export const projectSchema = z.object({
 id:z.string().uuid(), title:z.string().trim().min(1,'Add a project title.').max(200),
 phase:z.enum(['ideation','access','collection','analysis','writing','publication']),step:z.string().max(80),
 state:z.enum(['active','paused','published','archived']),priority:z.enum(['Normal','High','Low']),
 question:z.string().max(8000),collaborators:z.string().max(1000),nextAction:z.string().max(1000),due:date,
 journal:z.string().max(500),notes:z.string().max(20000),
 tasks:z.array(z.object({id:z.string().uuid(),title:z.string().trim().min(1).max(500),due:date,done:z.boolean()})).max(100),
 version:z.number().int().min(0),updatedAt:z.string(),
}).superRefine((p,ctx)=>{
 const phase=PHASES.find(x=>x.id===p.phase)!;
 if(!(phase.steps as readonly string[]).includes(p.step))ctx.addIssue({code:'custom',path:['step'],message:'Select a step in this phase.'});
 if(p.state==='published'&&(p.phase!=='publication'||p.step!=='Published'))ctx.addIssue({code:'custom',path:['state'],message:'Published projects must use Publication / Published.'});
});
export type Project=z.infer<typeof projectSchema>;
export function blankProject(phase:Phase='ideation'):Project{return {id:crypto.randomUUID(),title:'',phase,step:PHASES.find(x=>x.id===phase)!.steps[0],state:'active',priority:'Normal',question:'',collaborators:'',nextAction:'',due:'',journal:'',notes:'',tasks:[],version:0,updatedAt:''};}
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dateLabel(v:string){return v?new Date(v+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'No date';}
