import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { database } from '@/db/store';

/** Identity headers are supplied and protected by the Sites dispatcher. */
export async function getWorkspaceAccess() {
  const user = await getChatGPTUser();
  if (!user) return { signedIn: false, canEdit: false };

  const db = database();
  let owner = await db.prepare('SELECT user_id FROM workspace_owner WHERE id = 1').first<{user_id: string}>();
  if (!owner) {
    // Bootstrap once from the configured owner's verified sign-in email, then
    // authorize by the stable, Site-specific user ID on every request.
    const email = env.WORKSPACE_OWNER_EMAIL?.trim().toLowerCase();
    if (email && user.email.trim().toLowerCase() === email) {
      await db.prepare('INSERT INTO workspace_owner (id, user_id) VALUES (1, ?) ON CONFLICT(id) DO NOTHING').bind(user.userId).run();
      owner = await db.prepare('SELECT user_id FROM workspace_owner WHERE id = 1').first<{user_id: string}>();
    }
  }
  return { signedIn: true, canEdit: owner?.user_id === user.userId };
}
