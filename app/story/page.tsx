import type { Metadata } from 'next';
import { Shell } from '@/components/ui/Shell';
import { StoryPlayer } from './StoryPlayer';
import './story.css';

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'What TrustLens AI is, and every capability explained one narrated scene at a time.',
};

export default function StoryPage() {
  return (
    <Shell>
      <div className="page">
        <StoryPlayer />
      </div>
    </Shell>
  );
}
