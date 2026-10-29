import type { Metadata } from 'next';
import { LiquidStage } from '@/components/liquid/LiquidStage';
import { LiquidDock } from '@/components/liquid/LiquidDock';
import { StoryPlayer } from './StoryPlayer';
import '../liquid.css';
import './story.css';

export const metadata: Metadata = {
  title: 'The story',
  description:
    'What TrustLens AI is, and every feature explained one at a time — narrated in English or Tamil.',
};

export default function StoryPage() {
  return (
    <div className="lq">
      <LiquidStage />
      <main className="lq-main">
        <StoryPlayer />
      </main>
      <LiquidDock />
    </div>
  );
}
