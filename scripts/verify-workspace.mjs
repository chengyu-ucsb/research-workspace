import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const wranglerRequire=createRequire(require.resolve('wrangler/package.json'));
const { Miniflare }=wranglerRequire('miniflare');
const files=(await readdir('dist/server',{recursive:true})).filter(p=>p.endsWith('.js')||p.endsWith('.mjs'));
const modules=['index.js',...files.filter(p=>p!=='index.js')].map(p=>({type:'ESModule',path:resolve('dist/server',p)}));
const mf=new Miniflare({modules,modulesRoot:resolve('dist/server'),compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB'],bindings:{WORKSPACE_OWNER_EMAIL:'owner@example.com'}});
try{
 const db=await mf.getD1Database('DB');
 for(const file of (await readdir('drizzle')).filter(p=>p.endsWith('.sql')).sort()){
  for(const statement of (await readFile('drizzle/'+file,'utf8')).split('--> statement-breakpoint').filter(s=>s.trim()))await db.prepare(statement).run();
 }
 const owner={'oai-authenticated-user-id':'owner-test','oai-authenticated-user-email':'owner@example.com'};
 const visitor={'oai-authenticated-user-id':'visitor-test','oai-authenticated-user-email':'visitor@example.com'};
 const call=async(method,body,query='',identity=owner)=>{const r=await mf.dispatchFetch('http://workspace.test/api/projects'+query,{method,headers:{'Content-Type':'application/json',...identity},...(body?{body:JSON.stringify(body)}:{})});return {status:r.status,data:await r.json()};};
 assert.equal((await call('GET')).data.projects.length,0);
 const p={id:crypto.randomUUID(),title:'Verification project',phase:'ideation',step:'Research question',state:'active',priority:'Normal',question:'A test question',collaborators:'',nextAction:'Draft an outline',due:'2026-10-20',journal:'',notes:'Saved notes',tasks:[{id:crypto.randomUUID(),title:'Outline',due:'2026-10-18',done:false}],version:0,updatedAt:''};
 // Public reads are allowed, but neither anonymous visitors nor another
 // authenticated account can claim the workspace or write projects.
 assert.equal((await call('GET',null,'',{})).status,200);
 assert.equal((await call('PUT',p,'',{})).status,401);
 assert.equal((await call('DELETE',null,`?id=${p.id}&version=1`,{})).status,401);
 assert.equal((await call('PUT',p,'',visitor)).status,403);
 assert.equal((await call('DELETE',null,`?id=${p.id}&version=1`,visitor)).status,403);
 assert.equal(await db.prepare('SELECT user_id FROM workspace_owner WHERE id=1').first(),null);
 let r=await call('PUT',p);assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.project.version,1);let saved=r.data.project;
 assert.equal((await call('GET',null,'',{})).data.projects[0].notes,'Saved notes');
 assert.equal((await db.prepare('SELECT user_id FROM workspace_owner WHERE id=1').first()).user_id,'owner-test');
 assert.equal((await call('PUT',saved,'',{...visitor,'oai-authenticated-user-email':'owner@example.com'})).status,403);
 assert.equal((await call('PUT',saved,'',{})).status,401);
 // Once claimed, a future email change keeps the same owner's access intact.
 r=await call('PUT',saved,'',{...owner,'oai-authenticated-user-email':'new-owner-address@example.com'});assert.equal(r.status,200);saved=r.data.project;
 assert.equal((await call('PUT',p)).status,409);
 r=await call('PUT',{...saved,phase:'writing',step:'Full draft',tasks:saved.tasks.map(t=>({...t,done:true}))});assert.equal(r.status,200);saved=r.data.project;
 assert.equal((await call('GET')).data.projects[0].tasks[0].done,true);
 assert.equal((await call('PUT',{...saved,due:'2026-02-31'})).status,400);
 assert.equal((await call('PUT',{...saved,phase:'publication',step:'Full draft'})).status,400);
 assert.equal((await call('PUT',{...saved,state:'published'})).status,400);
 r=await call('PUT',{...saved,state:'published',phase:'publication',step:'Published'});assert.equal(r.status,200);saved=r.data.project;
 r=await call('PUT',{...saved,state:'archived'});assert.equal(r.status,200);saved=r.data.project;
 r=await call('PUT',{...saved,state:'active',step:'Preparing submission'});assert.equal(r.status,200);saved=r.data.project;
 const crossOrigin=await mf.dispatchFetch('http://workspace.test/api/projects',{method:'PUT',headers:{Origin:'https://unrelated.test','Content-Type':'application/json'},body:JSON.stringify(saved)});assert.equal(crossOrigin.status,403);
 assert.equal((await call('DELETE',null,`?id=${p.id}&version=1`)).status,409);
 assert.equal((await call('DELETE',null,`?id=${p.id}&version=${saved.version}`)).status,200);
 assert.equal((await call('GET')).data.projects.length,0);
 const page=await mf.dispatchFetch('http://workspace.test/');assert.equal(page.status,200);const html=await page.text();assert(html.includes('Research pipeline'));assert(html.includes('Research Workspace'));assert(html.includes('Public view'));assert(html.includes('Owner sign in'));assert(!html.includes('New project'));
 const ownerPage=await mf.dispatchFetch('http://workspace.test/',{headers:owner});assert.equal(ownerPage.status,200);const ownerHtml=await ownerPage.text();assert(ownerHtml.includes('Your research pipeline'));assert(ownerHtml.includes('Owner access'));assert(ownerHtml.includes('New project'));
 const visitorPage=await mf.dispatchFetch('http://workspace.test/',{headers:visitor});assert.equal(visitorPage.status,200);const visitorHtml=await visitorPage.text();assert(visitorHtml.includes('Public view'));assert(!visitorHtml.includes('New project'));
 console.log('Verified: anonymous public reads; anonymous and non-owner writes blocked; stable owner identity; public and owner page modes; create and read; persisted edits; phase moves; milestones; invalid data; stale edits; publication; archive and restore; cross-origin writes; versioned deletion.');
}finally{await mf.dispose();}
