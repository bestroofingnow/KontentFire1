import React, { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load template components
const BattleRoyaleTemplate = React.lazy(() => import('./battle-royale-template'));
const Basics101Template = React.lazy(() => import('./basics-101-template'));
const MythBusterTemplate = React.lazy(() => import('./myth-buster-template'));
const TechnicalGuideTemplate = React.lazy(() => import('./technical-guide-template'));
const CaseAgainstTemplate = React.lazy(() => import('./case-against-template'));
const ChecklistTemplate = React.lazy(() => import('./checklist-template'));

// Loading fallback component
const TemplateFallback = () => (
  <div className="p-8 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2">Loading template...</span>
  </div>
);

// Lazy loaded template components with suspense
export const LazyBattleRoyaleTemplate = (props: any) => (
  <Suspense fallback={<TemplateFallback />}>
    <BattleRoyaleTemplate {...props} />
  </Suspense>
);

export const LazyBasics101Template = (props: any) => (
  <Suspense fallback={<TemplateFallback />}>
    <Basics101Template {...props} />
  </Suspense>
);

export const LazyMythBusterTemplate = (props: any) => (
  <Suspense fallback={<TemplateFallback />}>
    <MythBusterTemplate {...props} />
  </Suspense>
);

export const LazyTechnicalGuideTemplate = (props: any) => (
  <Suspense fallback={<TemplateFallback />}>
    <TechnicalGuideTemplate {...props} />
  </Suspense>
);

export const LazyCaseAgainstTemplate = (props: any) => (
  <Suspense fallback={<TemplateFallback />}>
    <CaseAgainstTemplate {...props} />
  </Suspense>
);

export const LazyChecklistTemplate = (props: any) => (
  <Suspense fallback={<TemplateFallback />}>
    <ChecklistTemplate {...props} />
  </Suspense>
);