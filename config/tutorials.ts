import type { Placement } from '@floating-ui/react';

export interface TourStep {
  anchorId: string;
  title: string;
  message: string;
  placement: Placement;
}

export interface TourDefinition {
  pageKey: string;
  steps: TourStep[];
}

export const TOURS: Record<string, TourStep[]> = {
  dashboard: [
    {
      anchorId: 'tour-dashboard-stats',
      title: 'Stat Cards',
      message: 'Your pitch stats at a glance \u2014 total runs, average score, and personal best.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-dashboard-rubric',
      title: 'Rubric Breakdown',
      message: 'See how you score across five categories. Focus on your weakest bar.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-dashboard-recommendations',
      title: 'Practice Recommendations',
      message: 'Targeted drills based on your weakest areas. Start here for fastest improvement.',
      placement: 'top',
    },
    {
      anchorId: 'tour-dashboard-recent',
      title: 'Recent Runs',
      message: 'Your last few pitches. Click any to see the full breakdown.',
      placement: 'top',
    },
  ],

  session: [
    {
      anchorId: 'tour-session-record',
      title: 'Record Button',
      message: 'Hit this to start recording. Click again when done \u2014 AI analyzes immediately.',
      placement: 'top',
    },
    {
      anchorId: 'tour-session-deck',
      title: 'Deck Selector',
      message: 'Optionally load a slide deck to practice alongside.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-session-metrics',
      title: 'Metrics Panel',
      message: 'Live coaching: speech checklist, timer, filler words, and pacing \u2014 all in real time.',
      placement: 'left',
    },
  ],

  results: [
    {
      anchorId: 'tour-results-score',
      title: 'Score Hero',
      message: 'Your overall score out of 100, calculated from five rubric categories.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-results-fixes',
      title: 'Priority Fixes',
      message: 'The top improvements ranked by impact. Fix #1 first for the biggest score jump.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-results-rewrite',
      title: 'Rewrite Script',
      message: 'An AI-polished version of your pitch with all feedback applied. Copy and practice.',
      placement: 'top',
    },
    {
      anchorId: 'tour-results-delivery',
      title: 'Delivery Diagnostics',
      message: 'Speech metrics: WPM, filler rate, pacing. Aim for balanced delivery.',
      placement: 'top',
    },
  ],

  history: [
    {
      anchorId: 'tour-history-search',
      title: 'Search + Filters',
      message: 'Search by verdict or deck name. Filter by pitch mode to compare.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-history-view',
      title: 'View Toggle',
      message: 'Switch between list view (compact) and grid view (visual cards).',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-history-runs',
      title: 'Run Cards',
      message: 'Click any pitch to see the full analysis. Hover for playback and delete.',
      placement: 'top',
    },
  ],

  deck: [
    {
      anchorId: 'tour-deck-upload',
      title: 'Upload Button',
      message: 'Upload PDF or PPTX decks (max 50MB). Drag and drop works too.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-deck-ai',
      title: 'AI Create',
      message: 'Generate slides from a pitch description using AI.',
      placement: 'right',
    },
    {
      anchorId: 'tour-deck-cards',
      title: 'Deck Cards',
      message: 'Your deck library. Hover for download and delete options.',
      placement: 'top',
    },
  ],

  progress: [
    {
      anchorId: 'tour-progress-stats',
      title: 'Stats Overview',
      message: 'Current score, total change, practice streak, and session count.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-progress-kanban',
      title: 'Skill Board',
      message: 'A Kanban view of your five rubric skills. Move cards right as you improve.',
      placement: 'bottom',
    },
    {
      anchorId: 'tour-progress-timeline',
      title: 'Score Timeline',
      message: 'Your scores plotted over time. Watch the trend line.',
      placement: 'top',
    },
    {
      anchorId: 'tour-progress-categories',
      title: 'Category Breakdown',
      message: 'Deep dive into each category with average, trend, and recommended fixes.',
      placement: 'top',
    },
  ],
};

export const TOUR_STORAGE_PREFIX = 'pitchr-tour-seen:';
