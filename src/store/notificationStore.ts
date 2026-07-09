import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'pulse' | 'comment' | 'mention' | 'follow' | 'fomo' | 'collab_invite' | 'new_vibe' | 'vibe_like' | 'vibe_comment' | 'vibe_reply' | 'grind_reminder' | 'lang_match' | 'alert' | 'world_join' | 'game_invite' | 'world_admin' | 'message';
  user: string;
  avatar: string;
  text: string;
  time: string;
  isRead: boolean;
  postId?: string;
  vibeId?: string;
  commentId?: string;
  sparkId?: string;
  spark?: any;
  languages?: string[];
  thumbnail?: string;
  worldId?: string;
  chatId?: string;
  createdAt?: number; // epoch ms — used by the Data Retention engine for Tags/mentions expiry
}

interface NotificationState {
  globalVibeNotificationsEnabled: boolean;
  toggleGlobalVibeNotifications: () => void;
  likesNotificationsEnabled: boolean;
  toggleLikesNotifications: (val: boolean) => void;
  likesMilestonesOnly: boolean;
  toggleLikesMilestonesOnly: (val: boolean) => void;
  commentsNotificationsEnabled: boolean;
  toggleCommentsNotifications: (val: boolean) => void;
  repliesNotificationsEnabled: boolean;
  toggleRepliesNotifications: (val: boolean) => void;
  blazeRunRemindersEnabled: boolean;
  toggleBlazeRunReminders: (val: boolean) => void;
  blazeRunReminderTime: string;
  setBlazeRunReminderTime: (val: string) => void;
  pulseRewardsEnabled: boolean;
  togglePulseRewards: (val: boolean) => void;
  languageMatchNotificationsEnabled: boolean;
  toggleLanguageMatchNotifications: (val: boolean) => void;
  requestPushPermission: () => void;
  creatorNotificationPrefs: Record<string, boolean>;
  toggleCreatorNotifications: (id: string) => void;
  pulseToasts: any[];
  removePulseToast: (id: string) => void;
  soundEffectsEnabled: boolean;
  toggleSoundEffects: () => void;
  addToast: (points: number, message: string) => void;
  
  // Real notifications array and actions
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'isRead'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const playChime = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
    osc2.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
    
    osc1.type = "sine";
    osc2.type = "triangle";
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.95);
    
    osc1.start(audioCtx.currentTime);
    osc2.start(audioCtx.currentTime);
    
    osc1.stop(audioCtx.currentTime + 1.0);
    osc2.stop(audioCtx.currentTime + 1.0);
  } catch (e) {
    console.warn("AudioContext failed or blocked:", e);
  }
};

const getInitialNotifications = (): Notification[] => {
  try {
    const stored = localStorage.getItem('skrimchat_real_notifications');
    if (stored) return JSON.parse(stored);
  } catch (e) {}

  const seed: Notification[] = [
    {
      id: "notif_seed_1",
      type: "pulse",
      user: "Rahul Mehta",
      avatar: "https://picsum.photos/100/100?random=1",
      text: "pulsed your post ⚡",
      time: "1h ago",
      isRead: false
    },
    {
      id: "notif_seed_2",
      type: "comment",
      user: "Kavya",
      avatar: "https://picsum.photos/100/100?random=2",
      text: "commented on your reel: \"Ekdum mast hai bhai 💜\"",
      time: "2h ago",
      isRead: false
    },
    {
      id: "notif_seed_3",
      type: "mention",
      user: "Arjun",
      avatar: "https://picsum.photos/100/100?random=3",
      text: "mentioned you in a story: \"check this out!\"",
      time: "3h ago",
      isRead: true
    },
    {
      id: "notif_seed_4",
      type: "follow",
      user: "Sneha Rao",
      avatar: "https://picsum.photos/100/100?random=4",
      text: "started following you",
      time: "4h ago",
      isRead: true
    }
  ];
  try {
    localStorage.setItem('skrimchat_real_notifications', JSON.stringify(seed));
  } catch (e) {}
  return seed;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  globalVibeNotificationsEnabled: true,
  toggleGlobalVibeNotifications: () => set((state) => ({ globalVibeNotificationsEnabled: !state.globalVibeNotificationsEnabled })),
  likesNotificationsEnabled: true,
  toggleLikesNotifications: (val) => set({ likesNotificationsEnabled: val }),
  likesMilestonesOnly: false,
  toggleLikesMilestonesOnly: (val) => set({ likesMilestonesOnly: val }),
  commentsNotificationsEnabled: true,
  toggleCommentsNotifications: (val) => set({ commentsNotificationsEnabled: val }),
  repliesNotificationsEnabled: true,
  toggleRepliesNotifications: (val) => set({ repliesNotificationsEnabled: val }),
  blazeRunRemindersEnabled: true,
  toggleBlazeRunReminders: (val) => set({ blazeRunRemindersEnabled: val }),
  blazeRunReminderTime: '21:00',
  setBlazeRunReminderTime: (val) => set({ blazeRunReminderTime: val }),
  pulseRewardsEnabled: true,
  togglePulseRewards: (val) => set({ pulseRewardsEnabled: val }),
  languageMatchNotificationsEnabled: true,
  toggleLanguageMatchNotifications: (val) => set({ languageMatchNotificationsEnabled: val }),
  requestPushPermission: () => {},
  creatorNotificationPrefs: {},
  toggleCreatorNotifications: (id) => set((state) => ({ creatorNotificationPrefs: { ...state.creatorNotificationPrefs, [id]: !state.creatorNotificationPrefs[id] } })),
  pulseToasts: [],
  removePulseToast: (id) => set((state) => ({ pulseToasts: state.pulseToasts.filter(toast => toast.id !== id) })),
  soundEffectsEnabled: true,
  toggleSoundEffects: () => set((state) => ({ soundEffectsEnabled: !state.soundEffectsEnabled })),
  addToast: (points, message) => set((state) => {
    if (state.soundEffectsEnabled) {
      playChime();
    }
    const newToast = {
      id: `toast-${Date.now()}`,
      points,
      message,
      total: 12500 + points,
    };
    return { pulseToasts: [...state.pulseToasts, newToast] };
  }),

  notifications: getInitialNotifications(),
  addNotification: (notification) => set((state) => {
    const { type } = notification;

    // Respect existing preference toggles
    if ((type === 'vibe_like' || type === 'pulse') && !state.likesNotificationsEnabled) {
      return {};
    }
    if ((type === 'vibe_comment' || type === 'comment') && !state.commentsNotificationsEnabled) {
      return {};
    }
    if (type === 'vibe_reply' && !state.repliesNotificationsEnabled) {
      return {};
    }
    if (type === 'new_vibe' && !state.globalVibeNotificationsEnabled) {
      return {};
    }
    if (type === 'grind_reminder' && !state.blazeRunRemindersEnabled) {
      return {};
    }
    if (type === 'lang_match' && !state.languageMatchNotificationsEnabled) {
      return {};
    }

    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isRead: false,
      createdAt: notification.createdAt ?? Date.now(),
    };

    const updated = [newNotif, ...state.notifications];
    try {
      localStorage.setItem('skrimchat_real_notifications', JSON.stringify(updated));
    } catch (e) {}
    
    const unread = updated.filter(n => !n.isRead).length;
    localStorage.setItem('skrimchat_signal_unread', String(unread));
    window.dispatchEvent(new CustomEvent('skrimchat_signal_badge', { detail: unread }));

    return { notifications: updated };
  }),
  markNotificationAsRead: (id) => set((state) => {
    const updated = state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    try {
      localStorage.setItem('skrimchat_real_notifications', JSON.stringify(updated));
    } catch (e) {}

    const unread = updated.filter(n => !n.isRead).length;
    localStorage.setItem('skrimchat_signal_unread', String(unread));
    window.dispatchEvent(new CustomEvent('skrimchat_signal_badge', { detail: unread }));

    return { notifications: updated };
  }),
  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map((n) => ({ ...n, isRead: true }));
    try {
      localStorage.setItem('skrimchat_real_notifications', JSON.stringify(updated));
    } catch (e) {}

    localStorage.setItem('skrimchat_signal_unread', '0');
    window.dispatchEvent(new CustomEvent('skrimchat_signal_badge', { detail: 0 }));

    return { notifications: updated };
  }),
}));

// Mock functions
export const simulateCreatorPost = (user: any, reel: any) => {};
export const simulateVibeLike = (user: any, reel: any, likes: number) => {};
export const simulateVibeComment = (user: any, comment: any, reel: any, reply: boolean) => {};
export const scheduleGrindReminder = () => {};
export const showGrindNotification = (count: number) => {};
export const checkGrindRisk = () => ({ atRisk: false, grindCount: 0 });

export const simulatePulseReward = (event: string) => {
  let points = 50;
  let msg = "Unlocked achievement!";
  if (event.includes("milestone")) {
    points = 100;
    msg = "Reached a brand new follower milestone! 🏆";
  } else if (event.includes("streak")) {
    points = 200;
    msg = "Blaze Streak is hot! You got bonus points! 🔥";
  } else if (event.includes("vibe")) {
    points = 30;
    msg = "Your Vibe post is trending today! 📈";
  } else if (event.includes("birthday")) {
    points = 75;
    msg = "Spark wish successfully sent! Friend is happy! 🎉";
  } else {
    points = 50;
    msg = event || "Received Pulse Reward! ⚡";
  }
  
  useNotificationStore.getState().addToast(points, msg);
};

export const simulateLanguageMatchNotification = (langs: string[], count: number, force: boolean) => {};
