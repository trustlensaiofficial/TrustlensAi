import { redirect } from 'next/navigation';
/** Temporary: the dashboard lands here next. */
export default function Home(): never { redirect('/check'); }
