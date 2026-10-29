import type { Metadata } from 'next';
import { FlowShell } from '@/components/liquid/FlowShell';
import { StoryPlayer } from './StoryPlayer';
import './story.css';

export const metadata: Metadata = {
  title: 'The story',
  description:
    'What TrustLens AI is, and every feature explained one at a time — narrated in English or Tamil.',
};

export default function StoryPage() {
  return (
    <FlowShell>
      <StoryPlayer />
    </FlowShell>
  );
}
