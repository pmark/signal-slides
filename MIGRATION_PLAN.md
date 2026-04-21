# Migration Plan: SignalSlides Pivot

## 1. Strategy & Vision
SignalSlides is pivoting from a general "Topic Analysis Dashboard" to a specialized **Claim-Based Argument Builder**. 

### Core Architectural Shift
- **Object-Centricity:** We are moving away from "browsing topics" to "acting on objects" (Source → Claims → Deck → Remix).
- **Growth Mechanic:** The primary loop is centered on the **Remix**. Every deck is a starting point for a counter-narrative or a refined explanation.
- **System Neutrality:** The system will no longer "verify" or "dispute" claims as an authority (dropping `ClaimStatus`), but instead "classify" them into categories (**Verifiable, Opinion, Speculation, Prediction**) and map their relationships.

---

## 2. Information Architecture Overhaul

### 2.1 Refined Data Models
| Object | Key Changes |
| :--- | :--- |
| **Source** | Now the root entry point. Tracks input URL/text. |
| **Claim** | Strictly atomic. Classification limited to: `Verifiable`, `Opinion`, `Speculation`, `Prediction`. |
| **Deck** | Ordered sequence of Claims with optional Narration per step. |
| **Remix** | A specialized Deck with a `parentDeckId` for lineage tracking. |

### 2.2 Firebase Migration
- **Collection Flattening:** Move away from deeply nested `topics/{t}/claims/{c}` if possible, or refine the relationship to favor claim-first graphs.
- **Relational Mapping:** Implement `relatedClaims` and `opposingClaims` references to build the "Claim Graph".

---

## 3. UI/UX Overhaul (Site Structure)

### 3.1 Page Pivot Map
| Current Page | New Page / Action |
| :--- | :--- |
| **Home (Feed)** | **Home (Capture)**: Minimal input box. No feed. |
| **Topic Page** | **Claim Workspace**: The interface for refining extracted claims and building the deck. |
| **SlideDeck Viewer** | **Deck Viewer**: Immersive full-screen slide interaction with "Remix" as the primary CTA. |
| **SetupForm** | Integrated into the **Home** and **Workspace** flow. |

### 3.2 Interaction Philosophy
- **Speed to Value:** < 60 seconds from paste to first shareable deck.
- **Transparency:** Every slide explicitly links back to the original claim and source excerpt.
- **Remix Flow:** One-click transition from viewing a deck to a pre-loaded workspace.

---

## 4. Technical Implementation Plan

### Phase 1: Foundation (Types & Logic)
1. **Update `src/lib/types.ts`**: Align interfaces with the new spec (Source, Claim, Deck, Remix).
2. **Refine `src/lib/gemini.ts`**: 
   - Update prompt to focus on atomic extraction and the 4 specific classifications.
   - Implement streaming for claim extraction to provide immediate feedback.
3. **Draft `firebase-blueprint.json`**: Update schema to reflect the object relationships.

### Phase 2: Interface (Workspaces)
1. **Build `ClaimWorkspace.tsx`**: Replace the current narrative creator with the split-pane "Claim Stream | Deck Builder" layout.
2. **Build `DeckViewer.tsx`**: Immersive slide UI with remix capabilities.
3. **Simplify `App.tsx`**: Remove global feed, browsing, and discovery logic.

### Phase 3: Growth & Polish (Remapping)
1. **Implement Remix Flow**: Logic to clone a deck's claim set into a new workspace.
2. **Claim Inspection**: Contextual drawer/modal showing related claims and source excerpts.
3. **Design System (Tailwind)**: Apply a "Technical Dash" (Recipe 1) and "Editorial Hero" (Recipe 2) blend for a polished, professional tool feel.

---

## 5. Success Metrics
- **Remix Rate:** Number of remixed decks vs. shared decks.
- **Discovery Speed:** Time from input paste to claim extraction completion.
- **Clarity Index:** User ability to distinguish fact from opinion without system editorialization.
