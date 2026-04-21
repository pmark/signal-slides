import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  creatorId: string;
  category: string;
  tags: string[];
  createdAt: string;
}

export type ClaimType = 'factual' | 'opinion' | 'speculation' | 'prediction';
export type ClaimStatus = 'verified' | 'disputed' | 'unverified';

export interface AtomicClaim {
  id: string;
  topicId: string;
  statement: string;
  type: ClaimType;
  status: ClaimStatus;
  confidence: number;
  creatorId: string;
  sourceIds: string[];
  createdAt: string;
  interactionCount?: number;
}

export type AnalysisType = 'balanced' | 'comparison' | 'verification' | 'impact' | 'challenge';

export interface AnalysisSlide {
  title: string;
  subtitle?: string;
  content: {
    text: string;
    claimId?: string;
    statusHint?: ClaimStatus;
  }[];
  type: string;
}

export interface Analysis {
  id: string;
  topicId: string;
  title: string;
  type: AnalysisType;
  slides: AnalysisSlide[];
  claimIds: string[];
  creatorId: string;
  createdAt: string;
}

export interface Source {
  id: string;
  topicId: string;
  title: string;
  url: string;
  citation: string;
  addedById: string;
}

export type InteractionType = 'confirm' | 'question' | 'dispute' | 'refine';

export interface Interaction {
  id: string;
  claimId: string;
  topicId: string;
  userId: string;
  type: InteractionType;
  content?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export type NarrativeIntent = 'explain' | 'case' | 'challenge' | 'explore';
export type NarrativeSlideType = 'context' | 'fact' | 'interpretation' | 'implication' | 'conclusion';

export interface NarrativeSlide {
  id: string;
  type: NarrativeSlideType;
  claimIds: string[];
  narration?: string;
  title: string;
}

export interface NarrativeDeck {
  id: string;
  topicId: string;
  creatorId: string;
  title: string;
  thesis: string;
  intent: NarrativeIntent;
  slides: NarrativeSlide[];
  createdAt: string;
  creatorName?: string;
  creatorPhoto?: string;
  interactionCount?: number;
}

export interface GenerationOptions {
  topic: string;
  inputContent?: string;
  analysisType: AnalysisType;
}
