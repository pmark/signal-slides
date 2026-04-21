import { 
  Topic, 
  AtomicClaim, 
  Analysis, 
  Source, 
  Interaction, 
  InteractionType,
  NarrativeDeck
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
  increment,
  writeBatch
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
 * Service to manage Topics, Claims, Analyses, and structured interactions using Firestore.
 */
export const topicService = {
  /**
   * Initialize a new Topic with its initial set of claims, sources, and a first analysis.
   */
  async createTopicPackage(data: {
    topic: Partial<Topic>,
    claims: Partial<AtomicClaim>[],
    sources: Partial<Source>[],
    analysis: Partial<Analysis>,
    userId: string
  }): Promise<string> {
    const topicId = data.topic.id || crypto.randomUUID();
    const batch = writeBatch(db);

    // 1. Save Topic
    const topicRef = doc(db, 'topics', topicId);
    batch.set(topicRef, {
      ...data.topic,
      id: topicId,
      creatorId: data.userId,
      createdAt: serverTimestamp()
    });

    // 2. Save Claims
    const claimsColl = collection(db, 'topics', topicId, 'claims');
    data.claims.forEach(claim => {
      const cId = claim.id || crypto.randomUUID();
      const cRef = doc(claimsColl, cId);
      batch.set(cRef, {
        ...claim,
        id: cId,
        topicId: topicId,
        creatorId: data.userId,
        createdAt: serverTimestamp(),
        interactionCount: 0
      });
    });

    // 3. Save Sources
    const sourcesColl = collection(db, 'topics', topicId, 'sources');
    data.sources.forEach(source => {
      const sId = source.id || crypto.randomUUID();
      const sRef = doc(sourcesColl, sId);
      batch.set(sRef, {
        ...source,
        id: sId,
        topicId: topicId,
        addedById: data.userId,
        createdAt: serverTimestamp()
      });
    });

    // 4. Save Initial Analysis
    const analysisId = data.analysis.id || crypto.randomUUID();
    const analysisRef = doc(db, 'topics', topicId, 'analyses', analysisId);
    batch.set(analysisRef, {
      ...data.analysis,
      id: analysisId,
      topicId: topicId,
      creatorId: data.userId,
      createdAt: serverTimestamp()
    });

    try {
      await batch.commit();
      return topicId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `topics/${topicId}`);
      throw error;
    }
  },

  /**
   * Get all topics.
   */
  async getRecentTopics(limitCount = 10): Promise<Topic[]> {
    const path = 'topics';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(limitCount));
      const snap = await getDocs(q);
      return snap.docs.map(doc => mapDocToType<Topic>(doc.data()));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  /**
   * Get a topic by ID.
   */
  async getTopicById(id: string): Promise<Topic | null> {
    try {
      const snap = await getDoc(doc(db, 'topics', id));
      if (!snap.exists()) return null;
      return mapDocToType<Topic>(snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `topics/${id}`);
      return null;
    }
  },

  /**
   * Subscribe to claims for a topic.
   */
  subscribeToClaims(topicId: string, callback: (claims: AtomicClaim[]) => void) {
    const path = `topics/${topicId}/claims`;
    const q = query(collection(db, 'topics', topicId, 'claims'), orderBy('createdAt', 'asc'));
    
    return onSnapshot(q, (snap) => {
      const claims = snap.docs.map(doc => mapDocToType<AtomicClaim>(doc.data()));
      callback(claims);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Get a single claim by ID.
   */
  async getClaimById(topicId: string, claimId: string): Promise<AtomicClaim | null> {
    try {
      const snap = await getDoc(doc(db, 'topics', topicId, 'claims', claimId));
      if (!snap.exists()) return null;
      return mapDocToType<AtomicClaim>(snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `topics/${topicId}/claims/${claimId}`);
      return null;
    }
  },

  /**
   * Subscribe to analyses for a topic.
   */
  subscribeToAnalyses(topicId: string, callback: (analyses: Analysis[]) => void) {
    const q = query(collection(db, 'topics', topicId, 'analyses'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const analyses = snap.docs.map(doc => mapDocToType<Analysis>(doc.data()));
      callback(analyses);
    });
  },

  /**
   * Subscribe to sources for a topic.
   */
  subscribeToSources(topicId: string, callback: (sources: Source[]) => void) {
    const q = query(collection(db, 'topics', topicId, 'sources'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      const sources = snap.docs.map(doc => mapDocToType<Source>(doc.data()));
      callback(sources);
    });
  },

  /**
   * Add a new analysis to an existing topic.
   */
  async createAnalysis(topicId: string, analysis: Partial<Analysis>, userId: string): Promise<string> {
    const analysisId = analysis.id || crypto.randomUUID();
    const analysisRef = doc(db, 'topics', topicId, 'analyses', analysisId);
    
    try {
      await setDoc(analysisRef, {
        ...analysis,
        id: analysisId,
        topicId: topicId,
        creatorId: userId,
        createdAt: serverTimestamp()
      });
      return analysisId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `topics/${topicId}/analyses/${analysisId}`);
      throw error;
    }
  },

  /**
   * Record a structured interaction with a claim.
   */
  async recordInteraction(data: {
    claimId: string;
    topicId: string;
    userId: string;
    type: InteractionType;
    content?: string;
  }): Promise<void> {
    const id = crypto.randomUUID();
    const interactionRef = doc(db, 'topics', data.topicId, 'interactions', id);
    const claimRef = doc(db, 'topics', data.topicId, 'claims', data.claimId);

    const batch = writeBatch(db);
    batch.set(interactionRef, {
      ...data,
      id,
      createdAt: serverTimestamp()
    });
    
    // Update claim interaction count
    batch.update(claimRef, {
      interactionCount: increment(1)
    });

    // If certain logic applies, we might reclassify or dispute based on many interactions
    // For now, just record.

    try {
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `topics/${data.topicId}/interactions/${id}`);
    }
  },

  /**
   * Subscribe to topics for a specific user.
   */
  subscribeToUserTopics(userId: string, callback: (topics: Topic[]) => void) {
    const path = 'topics';
    const q = query(
      collection(db, path), 
      where('creatorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snap) => {
      const topics = snap.docs.map(doc => mapDocToType<Topic>(doc.data()));
      callback(topics);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  /**
   * Subscribe to narratives for a topic.
   */
  subscribeToNarratives(topicId: string, callback: (narratives: NarrativeDeck[]) => void) {
    const q = query(collection(db, 'topics', topicId, 'narratives'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const narratives = snap.docs.map(doc => mapDocToType<NarrativeDeck>(doc.data()));
      callback(narratives);
    });
  },

  /**
   * Subscribe to interactions for a specific claim.
   */
  subscribeToClaimInteractions(topicId: string, claimId: string, callback: (interactions: Interaction[]) => void) {
    const q = query(
      collection(db, 'topics', topicId, 'interactions'), 
      where('claimId', '==', claimId),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const interactions = snap.docs.map(doc => mapDocToType<Interaction>(doc.data()));
      callback(interactions);
    });
  },

  /**
   * Add a new narrative deck to a topic.
   */
  async createNarrative(topicId: string, narrative: Partial<NarrativeDeck>, userId: string): Promise<string> {
    const id = narrative.id || crypto.randomUUID();
    const ref = doc(db, 'topics', topicId, 'narratives', id);
    
    try {
      await setDoc(ref, {
        ...narrative,
        id,
        topicId,
        creatorId: userId,
        createdAt: serverTimestamp(),
        interactionCount: 0
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `topics/${topicId}/narratives/${id}`);
      throw error;
    }
  },

  /**
   * Get a narrative by ID.
   */
  async getNarrativeById(topicId: string, narrativeId: string): Promise<NarrativeDeck | null> {
    try {
      const snap = await getDoc(doc(db, 'topics', topicId, 'narratives', narrativeId));
      if (!snap.exists()) return null;
      return mapDocToType<NarrativeDeck>(snap.data());
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `topics/${topicId}/narratives/${narrativeId}`);
      return null;
    }
  }
};
