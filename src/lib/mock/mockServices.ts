import { FEATURE_FLAGS } from '../config/featureFlags';
import { 
  mockPosts, mockSparks, mockReels, mockChats, 
  mockMessages, mockNotifications, mockCommunities, 
  mockCreatorStats, mockUsers, mockAds, mockAdminData 
} from './mockData';
import { getAllRecords, deleteRecord, sortPostsLatestFirst } from '../services/mediaStorage';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getPosts = async () => {
  await delay(500);
  return [...mockPosts];
};

// Collects every original Spark id still needed by a saved Highlight, so a
// purge never deletes media a Highlight is depending on.
function getHighlightReferencedSparkIds(): Set<string> {
  const ids = new Set<string>();
  try {
    const stored = localStorage.getItem('skrimchat_highlights');
    if (!stored) return ids;
    const highlights = JSON.parse(stored);
    if (!Array.isArray(highlights)) return ids;
    highlights.forEach((hl: any) => {
      if (typeof hl.cover === 'string' && hl.cover.startsWith('__base64_cover__')) {
        ids.add(hl.cover.split(':')[1]);
      }
      if (Array.isArray(hl.sparks)) {
        hl.sparks.forEach((s: any) => {
          const originalId = s.id || s.originalSparkId;
          if (originalId) ids.add(originalId);
        });
      }
    });
  } catch (e) {
    console.error("Failed to read highlights while purging expired sparks:", e);
  }
  return ids;
}

// A Spark's only home is local device storage (IndexedDB, falling back to
// localStorage) — there is no separate cloud copy today. Once a Spark
// expires it is permanently deleted from that storage, unless a saved
// Highlight still depends on its media.
export const purgeExpiredSparks = async () => {
  let stored: any[] = [];
  try {
    stored = await getAllRecords('sparks');
  } catch (e) {
    console.error("Failed to read sparks while purging expired sparks:", e);
    return;
  }
  const now = Date.now();
  const referenced = getHighlightReferencedSparkIds();
  const toDelete = stored.filter(s => s.expiresAt && s.expiresAt <= now && !referenced.has(s.id));
  await Promise.all(toDelete.map(s => deleteRecord('sparks', s.id).catch(e => {
    console.error(`Failed to delete expired spark ${s.id}:`, e);
  })));
};

export const getSparks = async () => {
  await delay(500);
  await purgeExpiredSparks();
  let stored: any[] = [];
  try {
    stored = await getAllRecords('sparks');
  } catch (e) {
    console.error("Failed to read sparks from IndexedDB:", e);
  }
  // Merge: stored (own/reposted) sparks first, then mock sparks, de-duped by id
  const seen = new Set(stored.map(s => s.id));
  const merged = [...stored, ...mockSparks.filter((s: any) => !seen.has(s.id))];
  return sortPostsLatestFirst(merged);
};

// Sparks that expired but are still on disk only because a saved Highlight
// depends on their media (see purgeExpiredSparks above). Used internally to
// restore Highlight covers/media — not a user-facing archive.
export const getArchivedSparks = async () => {
  await delay(300);
  await purgeExpiredSparks();
  let stored: any[] = [];
  try {
    stored = await getAllRecords('sparks');
  } catch (e) {
    console.error("Failed to read archived sparks from IndexedDB:", e);
  }
  const now = Date.now();
  return stored.filter(s => s.isOwn && s.expiresAt && s.expiresAt <= now);
};

export const getReels = async () => {
  await delay(500);
  return [...mockReels];
};

export const getChats = async () => {
  await delay(500);
  return [...mockChats];
};

export const getMessages = async (chatId: string) => {
  await delay(500);
  return [...mockMessages];
};

export const getNotifications = async () => {
  await delay(500);
  return [...mockNotifications];
};


export const getCreatorStats = async () => {
  await delay(500);
  return mockCreatorStats;
};

export const likePost = async (postId: string) => {
  await delay(50);
  // Real persistence is handled in the component; this stub is kept for API-shape compatibility
  return { success: true, postId };
};

export const shareSpark = async (sparkId: string, targetUsername: string, sparkData?: { thumbnail?: string; caption?: string; user?: { user: string; handle: string; avatar: string }; mood?: string }) => {
  await delay(100);
  try {
    const key = 'skrimchat_custom_chats';
    const chats = JSON.parse(localStorage.getItem(key) || '{}');
    if (!chats[targetUsername]) chats[targetUsername] = [];
    chats[targetUsername].push({
      id: Date.now().toString() + Math.random(),
      type: 'spark_share',
      sparkId,
      sparkThumbnail: sparkData?.thumbnail || '',
      sparkCaption: sparkData?.caption || '',
      sparkUser: sparkData?.user || { user: 'Unknown', handle: '', avatar: '' },
      sparkMood: sparkData?.mood,
      isRepost: false,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      timestamp: Date.now(),
      createdAt: Date.now(),
    });
    localStorage.setItem(key, JSON.stringify(chats));
  } catch (e) {}
  return { success: true };
};

export const followUser = async (userId: string) => {
  await delay(200);
  return { success: true };
};

export const sendMessage = async (chatId: string, message: any) => {
  await delay(300);
  return { success: true, message: { id: `msg_new_${Date.now()}`, ...message } };
};

export const searchUsers = async (query: string) => {
  await delay(500);
  if (!query) return [];
  return mockUsers.filter(u => u.username.toLowerCase().includes(query.toLowerCase()) || u.displayName.toLowerCase().includes(query.toLowerCase()));
};

export const getAds = async () => {
  await delay(500);
  return [...mockAds];
};

export const getAdminData = async () => {
  await delay(500);
  return mockAdminData;
};
