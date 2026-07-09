/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';

export interface ModerationLogEntry {
  id: string;
  surface: 'pulse' | 'vibe' | 'spark';
  mediaKind: 'image' | 'video';
  score: number;
  categories: string[];
  source: 'remote' | 'local_heuristic';
  userHandle?: string;
  createdAt: number;
}

const LOG_KEY = 'skrimchat_moderation_log';

function loadLog(): ModerationLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistLog(entries: ModerationLogEntry[]) {
  try {
    // Keep this bounded — it's an audit trail, not unbounded storage.
    localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(0, 500)));
  } catch (e) {
    console.warn('Failed to persist moderation log', e);
  }
}

interface ModerationLogState {
  entries: ModerationLogEntry[];
  hydrate: () => void;
  /**
   * Records an auto-block event. This is fired automatically by the
   * moderation gate the instant flagged media is rejected — it's a
   * read-only audit record for the SkrimChat team, not an approval gate.
   * The content is already blocked by the time this is called.
   */
  logAutoBlock: (entry: Omit<ModerationLogEntry, 'id' | 'createdAt'>) => void;
  clear: () => void;
}

export const useModerationLogStore = create<ModerationLogState>((set, get) => ({
  entries: [],
  hydrate: () => set({ entries: loadLog() }),
  logAutoBlock: (entry) => {
    const newEntry: ModerationLogEntry = {
      ...entry,
      id: `modlog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };
    const next = [newEntry, ...get().entries];
    set({ entries: next });
    persistLog(next);
  },
  clear: () => {
    set({ entries: [] });
    persistLog([]);
  },
}));
