import {database} from '@/db/store';
import {getWorkspaceAccess} from '@/lib/access';
import {projectSchema} from '@/lib/projects';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
function sameOrigin(r:Request){const origin=r.headers.get('origin');return !origin || origin===new URL(r.url).origin;}
export async function GET(){try{const rows=await database().prepare('SELECT data FROM projects ORDER BY updated_at DESC').all<{data:string}>();return reply({projects:rows.results.map(r=>JSON.parse(r.data))});}catch(e){console.error('Load projects',e);return reply({error:'Your workspace could not load. Please retry.'},503);}}
export async function PUT(request:Request){
 if(!sameOrigin(request))return reply({error:'Request origin not allowed.'},403);
 try{
  const access=await getWorkspaceAccess();if(!access.canEdit)return reply({error:'Only the workspace owner can edit projects.'},access.signedIn?403:401);
  const raw=await request.text();if(raw.length>150000)return reply({error:'This project is too large.'},413);
  let input:unknown;try{input=JSON.parse(raw);}catch{return reply({error:'Invalid project data.'},400);}
  const parsed=projectSchema.safeParse(input);if(!parsed.success)return reply({error:parsed.error.issues[0].message},400);
  const p=parsed.data;const saved={...p,version:p.version+1,updatedAt:new Date().toISOString()};const db=database();
  let result;
  if(p.version===0){result=await db.prepare('INSERT INTO projects (id,title,data,version,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(saved.id,saved.title,JSON.stringify(saved),saved.version,saved.updatedAt).run();}
  else{result=await db.prepare('UPDATE projects SET title=?,data=?,version=?,updated_at=? WHERE id=? AND version=?').bind(saved.title,JSON.stringify(saved),saved.version,saved.updatedAt,saved.id,p.version).run();}
  if(!result.meta.changes)return reply({error:'This project changed in another window. Your draft is still here; copy any unsaved text, then close and refresh before editing.'},409);
  return reply({project:saved});
 }catch(e){console.error('Save project',e);return reply({error:'Could not save. Your changes are still in the editor; please retry.'},503);}
}
export async function DELETE(request:Request){
 if(!sameOrigin(request))return reply({error:'Request origin not allowed.'},403);
 try{const access=await getWorkspaceAccess();if(!access.canEdit)return reply({error:'Only the workspace owner can edit projects.'},access.signedIn?403:401);
 const u=new URL(request.url),id=u.searchParams.get('id'),version=Number(u.searchParams.get('version'));if(!id||!Number.isInteger(version)||version<1)return reply({error:'Invalid project.'},400);
 const result=await database().prepare('DELETE FROM projects WHERE id=? AND version=?').bind(id,version).run();if(!result.meta.changes)return reply({error:'This project changed. Refresh before deleting.'},409);return reply({deleted:id});
 }catch(e){console.error('Delete project',e);return reply({error:'Could not delete. Please retry.'},503);}
}
