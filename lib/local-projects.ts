import {z} from 'zod';
import {projectSchema} from './projects.ts';
import type {Project} from './projects.ts';

export const STORAGE_KEY='research-workspace:projects:v1';
const projectsSchema=z.array(projectSchema).max(1000).refine(
  projects=>new Set(projects.map(p=>p.id)).size===projects.length,
  'The backup has duplicate project IDs.',
);
const backupSchema=z.object({format:z.literal('research-workspace'),version:z.literal(1),projects:projectsSchema});

/** Stored only in this browser. No account, cookie, or server is used. */
export function readLocalProjects(storage:Storage=localStorage):Project[]{
  const raw=storage.getItem(STORAGE_KEY);
  if(raw===null)return [];
  try{return projectsSchema.parse(JSON.parse(raw));}
  catch{throw new Error('Your saved workspace could not be read. It has been kept intact. Import a valid backup to restore it.');}
}

function writeProjects(projects:Project[],storage:Storage){
  try{storage.setItem(STORAGE_KEY,JSON.stringify(projectsSchema.parse(projects)));}
  catch{throw new Error('This browser could not save the changes. Export a backup, then check available browser storage.');}
}

// Web Locks serialize changes across tabs where available. The version check
// also catches drafts edited after a different tab saved a newer revision.
async function withWriteLock<T>(action:()=>T):Promise<T>{
  if(typeof navigator!=='undefined'&&navigator.locks){
    return navigator.locks.request(STORAGE_KEY,async()=>action());
  }
  return action();
}

export async function saveLocalProject(input:Project,storage:Storage=localStorage){
  return withWriteLock(()=>{
    const project=projectSchema.parse(input),all=readLocalProjects(storage);
    const current=all.find(p=>p.id===project.id);
    if((!current&&project.version!==0)||(current&&current.version!==project.version)){
      throw new Error('This project changed in another tab. Copy any unsaved text, then close and refresh before editing.');
    }
    const saved={...project,version:project.version+1,updatedAt:new Date().toISOString()};
    writeProjects([saved,...all.filter(p=>p.id!==project.id)],storage);
    return saved;
  });
}

export async function deleteLocalProject(project:Project,storage:Storage=localStorage){
  return withWriteLock(()=>{
    const all=readLocalProjects(storage),current=all.find(p=>p.id===project.id);
    if(!current||current.version!==project.version)throw new Error('This project changed in another tab. Refresh before deleting.');
    writeProjects(all.filter(p=>p.id!==project.id),storage);
  });
}

export function serializeBackup(projects:Project[]){
  return JSON.stringify({format:'research-workspace',version:1,exportedAt:new Date().toISOString(),projects:projectsSchema.parse(projects)},null,2);
}

export function parseBackup(text:string):Project[]{
  if(text.length>25_000_000)throw new Error('This backup is too large.');
  try{return backupSchema.parse(JSON.parse(text)).projects;}
  catch{throw new Error('This is not a valid Research Workspace backup. Your current projects have not changed.');}
}

export async function restoreBackup(incoming:Project[],storage:Storage=localStorage){
  return withWriteLock(()=>{
    const checked=projectsSchema.parse(incoming);
    let previous:Project[]=[];
    try{previous=readLocalProjects(storage);}catch{/* A confirmed restore can repair unreadable storage. */}
    const restored=checked.map(p=>({...p,version:Math.max(p.version,previous.find(old=>old.id===p.id)?.version??0)+1}));
    writeProjects(restored,storage);
    return restored;
  });
}
