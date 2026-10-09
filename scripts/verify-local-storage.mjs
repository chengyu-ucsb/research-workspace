import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {STORAGE_KEY,readLocalProjects,saveLocalProject,deleteLocalProject,serializeBackup,parseBackup,restoreBackup} from '../lib/local-projects.ts';
import {blankProject} from '../lib/projects.ts';
class MemoryStorage {
 data=new Map();
 getItem(key){return this.data.get(key)??null;}
 setItem(key,value){this.data.set(key,String(value));}
 removeItem(key){this.data.delete(key);}
 clear(){this.data.clear();}
 key(index){return [...this.data.keys()][index]??null;}
 get length(){return this.data.size;}
}
const db=new MemoryStorage();
assert.deepEqual(readLocalProjects(db),[]);
const draft={...blankProject(),title:'Storage verification',notes:'Keep the research notes',tasks:[{id:crypto.randomUUID(),title:'Outline',due:'2026-10-12',done:false}]};
let saved=await saveLocalProject(draft,db);
assert.equal(saved.version,1);
assert.equal(readLocalProjects(db)[0].notes,draft.notes);
assert.throws(()=>parseBackup('{broken'));
await assert.rejects(()=>saveLocalProject(draft,db),/changed in another tab/);
saved=await saveLocalProject({...saved,phase:'analysis',step:'Coding / modeling',tasks:saved.tasks.map(t=>({...t,done:true}))},db);
assert.equal(readLocalProjects(db)[0].phase,'analysis');
assert.equal(readLocalProjects(db)[0].tasks[0].done,true);
const backup=parseBackup(serializeBackup(readLocalProjects(db)));
const anotherDevice=new MemoryStorage();
await restoreBackup(backup,anotherDevice);
assert.equal(readLocalProjects(anotherDevice)[0].notes,draft.notes);
const before=anotherDevice.getItem(STORAGE_KEY);
await assert.rejects(()=>restoreBackup([{...saved,title:''}],anotherDevice));
assert.equal(anotherDevice.getItem(STORAGE_KEY),before);
await assert.rejects(()=>restoreBackup([saved,saved],anotherDevice));
assert.equal(anotherDevice.getItem(STORAGE_KEY),before);
await restoreBackup(backup,db);
await assert.rejects(()=>deleteLocalProject(saved,db),/changed in another tab/);
saved=readLocalProjects(db)[0];
saved=await saveLocalProject({...saved,state:'archived'},db);
assert.equal(readLocalProjects(db)[0].state,'archived');
await deleteLocalProject(saved,db);
assert.equal(readLocalProjects(db).length,0);
db.setItem(STORAGE_KEY,'corrupt data');
assert.throws(()=>readLocalProjects(db),/kept intact/);
assert.equal(db.getItem(STORAGE_KEY),'corrupt data');
await restoreBackup(backup,db);
assert.equal(readLocalProjects(db)[0].title,draft.title);
const full=new MemoryStorage();
full.setItem=()=>{throw new Error('Quota exceeded');};
await assert.rejects(()=>saveLocalProject(draft,full),/could not save/);
const html=await readFile('docs/index.html','utf8');
assert(!html.includes('src="/assets/'));assert(html.includes('./assets/'));
for(const path of [...html.matchAll(/(?:src|href)="(\.\/assets\/[^\"]+)"/g)].map(m=>m[1]))await readFile('docs/'+path);
assert((await readdir('docs/assets')).some(f=>f.endsWith('.js')));
console.log('Verified: persistent edits; stale edits blocked; phase moves; milestones; archive/delete; backup export and restore; malformed backups rejected without data loss; corrupt storage recovery; quota errors; relative GitHub Pages assets.');
