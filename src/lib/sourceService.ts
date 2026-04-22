import { 
  Source, 
  Claim, 
  Deck
} from "./types";
import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from "./firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  writeBatch,
  deleteDoc
} from "firebase/firestore";

/**
 * Helper to map Firestore data back to types.
 */
function mapDocToType<T>(data: Record<string, unknown>): T {
  return {
    ...data,
    createdAt: data.createdAt instanceof Timestamp 
      ? data.createdAt.toDate().toISOString() 
      : data.createdAt
  } as T;
}

/**
 * Service to manage Sources, Claims, and Decks.
 */
export const sourceService = {
  /**
   * Initialize a new Source with its initial set of claims and an optional starting deck.
   */
  async createExtractionPackage(data: {
    source: Partial<Source>,
    claims: Partial<Claim>[],
    initialDeck?: Partial<Deck>,
    userId: string
  }): Promise<{ sourceId: string, deckId?: string }> {
    const sourceId = data.source.id || crypto.randomUUID();
    const batch = writeBatch(db);

    // 1. Save Source
    const sourceRef = doc(db, 'sources', sourceId);
    batch.set(sourceRef, {
      ...data.source,
      id: sourceId,
      creatorId: data.userId,
      createdAt: serverTimestamp(),
      url: data.source.url ?? null,
      content: data.source.content ?? null
    });

    // 2. Save Claims
    const claimsColl = collection(db, 'sources', sourceId, 'claims');
    data.claims.forEach(claim => {
      const cId = claim.id || crypto.randomUUID();
      const cRef = doc(claimsColl, cId);
      batch.set(cRef, {
        ...claim,
        id: cId,
        sourceId: sourceId,
        creatorId: data.userId,
        createdAt: serverTimestamp()
      });
    });

    // 3. Save Initial Deck (if provided)
    let deckId: string | undefined;
    if (data.initialDeck) {
      deckId = data.initialDeck.id || crypto.randomUUID();
      const deckRef = doc(db, 'sources', sourceId, 'decks', deckId);
      batch.set(deckRef, {
        ...data.initialDeck,
        id: deckId,
        sourceId: sourceId,
        creatorId: data.userId,
        createdAt: serverTimestamp()
      });
    }

    try {
      await batch.commit();
      return { sourceId, deckId };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sources/${sourceId}`);
      throw error;
    }
  },

  /**
   * Get a source by ID.
   */
  async getSourceById(id: string): Promise<Source | null> {
    try {
      const snap = await getDoc(doc(db, 'sources', id));
      if (!snap.exists()) return null;
      return mapDocToType<Source>(snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `sources/${id}`);
      return null;
    }
  },

  /**
   * Subscribe to claims for a source.
   */
  subscribeToClaims(sourceId: string, callback: (claims: Claim[]) => void) {
    const path = `sources/${sourceId}/claims`;
    const q = query(collection(db, 'sources', sourceId, 'claims'), orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (snap) => {
      const claims = snap.docs.map(doc => mapDocToType<Claim>(doc.data()));
      callback(claims);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Subscribe to decks for a source.
   */
  subscribeToDecks(sourceId: string, callback: (decks: Deck[]) => void) {
    const q = query(collection(db, 'sources', sourceId, 'decks'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const decks = snap.docs.map(doc => mapDocToType<Deck>(doc.data()));
      callback(decks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `sources/${sourceId}/decks`);
    });
  },

  /**
   * Get the latest draft deck for a specific source and user.
   */
  async getLatestDraftForSource(sourceId: string, userId: string): Promise<Deck | null> {
    try {
      const q = query(
        collection(db, 'sources', sourceId, 'decks'),
        where('creatorId', '==', userId),
        where('status', '==', 'draft'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return null;
      return mapDocToType<Deck>(snap.docs[0].data());
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `sources/${sourceId}/decks (draft search)`);
      return null;
    }
  },

  /**
   * Create a new deck (or remix).
   */
  async createDeck(sourceId: string, deck: Partial<Deck>, userId: string): Promise<string> {
    const id = deck.id || crypto.randomUUID();
    const ref = doc(db, 'sources', sourceId, 'decks', id);
    
    try {
      await setDoc(ref, {
        ...deck,
        id,
        sourceId,
        creatorId: userId,
        createdAt: serverTimestamp()
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sources/${sourceId}/decks/${id}`);
      throw error;
    }
  },

  /**
   * Get a deck by ID.
   */
  async getDeckById(sourceId: string, deckId: string): Promise<Deck | null> {
    try {
      const snap = await getDoc(doc(db, 'sources', sourceId, 'decks', deckId));
      if (!snap.exists()) return null;
      return mapDocToType<Deck>(snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `sources/${sourceId}/decks/${deckId}`);
      return null;
    }
  },

  /**
   * Delete a deck by ID.
   */
  async deleteDeck(sourceId: string, deckId: string): Promise<void> {
    const ref = doc(db, 'sources', sourceId, 'decks', deckId);
    try {
      await deleteDoc(ref);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sources/${sourceId}/decks/${deckId}`);
    }
  },

  /**
   * Delete a source and all its sub-collections.
   * Note: Production apps should handle recursive subcollection deletion differently 
   * (e.g., via Cloud Function), but for this applet we'll do simple doc deletion.
   */
  async deleteSource(sourceId: string): Promise<void> {
    const ref = doc(db, 'sources', sourceId);
    try {
      await deleteDoc(ref);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sources/${sourceId}`);
    }
  },

  /**
   * Subscribe to sources for a specific user.
   */
  subscribeToUserSources(userId: string, callback: (sources: Source[]) => void) {
    const q = query(
      collection(db, 'sources'), 
      where('creatorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snap) => {
      const sources = snap.docs.map(doc => mapDocToType<Source>(doc.data()));
      callback(sources);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sources');
    });
  }
};
