# SignalSlides Security Specification

## 1. Data Invariants
1. **Immutable Paternity**: Claims, Analyses, Sources, and Narratives MUST remain linked to their parent `topicId` indefinitely.
2. **Identity Integrity**: Any `creatorId` or `userId` in a document MUST strictly match the authenticated user's UID (`request.auth.uid`).
3. **Verified Interaction**: Interactions (verifications/disputes) can only be created by authenticated users.
4. **Terminal State**: Once a claim is marked as `verified` or `disputed` (system-only or through admin action), its core status should be protected from casual client modification. (Note: Interaction count increments are allowed).
5. **Topic Access**: All sub-resources (claims, narratives, etc.) are public for reading but strictly restricted for writing based on ownership.

## 2. The Dirty Dozen (Payloads designed to break the system)

### ID Poisoning & Shadow Fields
1. **Large String ID**: Attempting to create a topic with a 2KB junk character string as a `topicId`.
2. **Shadow Admin Field**: Attempting to create a user profile or topic with `isAdmin: true` injected into the payload.

### Identity Spoofing
3. **The Proxy Vote**: User A attempting to record an interaction (`confirm`) with `userId: "UserB"`.
4. **Narrative Hijack**: User B attempting to update User A's `NarrativeDeck`.

### Relational & Integrity Attacks
5. **Orphan Interaction**: Attempting to create an interaction for a `claimId` that does not exist.
6. **Cross-Topic Injection**: Attempting to create a claim in `topic/TopicA/claims/` but with `topicId: "TopicB"` in the JSON body.

### Resource Exhaustion (Denial of Wallet)
7. **Jumbo Statement**: Creating a claim where `statement` is a 1MB string of text.
8. **Array Bomb**: Creating a topic with 5,000 tags in the `tags` array.

### Logic & State Hacks
9. **Instant Verification**: A regular user attempting to update a claim's `status` directly to "verified" without an interaction trail.
10. **Backdated Signal**: Creating a topic with `createdAt` set to a date in 1999 to bypass "Recent Topics" filters.
11. **Future Interaction**: Submitting an interaction with `createdAt` set to a future timestamp.
12. **Content Poisoning**: Submitting an interaction `content` that is empty or just whitespace but exceeds string type checks.

## 3. Test Runner Plan

The following `firestore.rules` will be validated against these payloads.
- Writes to `Interaction` MUST enforce `request.auth.uid == incoming().userId`.
- Writes to `NarrativeDeck` MUST enforce `request.auth.uid == incoming().creatorId`.
- All string sizes MUST be capped (e.g., `statement.size() < 1000`).
- Collection sizes MUST be capped (e.g., `tags.size() < 10`).
