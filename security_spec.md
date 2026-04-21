# SignalSlides Security Specification

## 1. Data Invariants
1. **Source Continuity**: Claims and Decks MUST remain linked to their parent `sourceId` definitely.
2. **Identity Integrity**: Any `creatorId` in a document MUST strictly match the authenticated user's UID (`request.auth.uid`).
3. **Atomic Claims**: Claims MUST remain atomic and classified according to the schema (verifiable, opinion, speculation, prediction).
4. **Verified Intent**: Decks MUST have a valid intent and not exceed reasonable slide counts.

## 2. The Dirty Dozen (Attack Vectors)
1. **Source Spoofing**: User A creates a source with `creatorId: "UserB"`.
2. **Classification Injection**: Setting a claim classification to a non-existent type like 'absolute-truth'.
3. **Narration Bloat**: Injecting 1MB of text into a deck slide's narration field.
4. **Remix Hijacking**: User B attempts to update User A's deck directly.
5. **Path Poisoning**: Creating a claim in `sources/SourceA/claims/` but setting its `sourceId` field to `SourceB`.
6. **Shadow Verification**: Attempting to add an `isVerified` field to a claim (not in schema).
7. **Time Travel**: Backdating a deck's `createdAt` to 1999.
8. **Slide Bomb**: Creating a deck with 500 slides to exhaust viewer memory.
9. **Jumbo Source**: Pasting 10MB of content into a Source's `content` field.
10. **ID Poisoning**: Using a 5KB string as a `sourceId`.
11. **Orphan Deck**: Creating a deck with a `sourceId` that doesn't exist in the root collection.
12. **Status Loophole**: Exploiting `affectedKeys` to change immutable fields like `creatorId`.

## 3. Test Runner Plan
- All write operations MUST be authenticated and validated by `isValid[Entity]()`.
- Update operations MUST use `affectedKeys().hasOnly()` to restrict mutation to allowed fields.
- Public read access is permitted for global sharing, but write access is strictly ownership-based.
