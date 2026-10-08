import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Research Workspace · Chengyu Fang',description:'A personal workspace for research projects, milestones, and writing.',robots:{index:false,follow:false},icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
