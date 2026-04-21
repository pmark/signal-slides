import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type ClaimType = 'verifiable' | 'opinion' | 'speculation' | 'prediction';

export interface Source {
  id: string;
  url?: string;
  content?: string; // Raw input text
  title: string;
  creatorId: string;
  createdAt: string;
}

export interface Claim {
  id: string;
  sourceId: string;
  statement: string;
  classification: ClaimType;
  creatorId: string;
  createdAt: string;
  relatedClaimIds?: string[];
  opposingClaimIds?: string[];
}

export type NarrativeIntent = 'explain' | 'case' | 'challenge' | 'compare';

export interface DeckSlide {
  id?: string;
  claimId: string;
  narration?: string;
  order: number;
}

export interface Deck {
  id: string;
  sourceId: string;
  creatorId: string;
  title: string;
  intent: NarrativeIntent;
  slides: DeckSlide[];
  parentDeckId?: string; // If this is a remix
  createdAt: string;
  creatorName?: string;
  creatorPhoto?: string;
}

export interface GenerationOptions {
  sourceInput: string;
  intent: NarrativeIntent;
}
