import Workspace from './workspace';
import { chatGPTSignInPath, chatGPTSignOutPath } from './chatgpt-auth';
import { getWorkspaceAccess } from '@/lib/access';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const access = await getWorkspaceAccess();
  return <Workspace {...access} signInHref={chatGPTSignInPath('/')} signOutHref={chatGPTSignOutPath('/')}/>;
}
