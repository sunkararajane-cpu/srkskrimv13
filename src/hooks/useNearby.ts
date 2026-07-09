import { useState, useEffect, useCallback } from 'react';
import { mockNearbyUsers, NearbyUser, MoodStatus, IcebreakerType } from '../lib/mock/mockNearby';
import { haversineDistanceKm, destinationPoint } from '../lib/geo';

export type RadiusKm = 1 | 5 | 10 | 25 | 50;
export type PresenceDuration = '15m' | '1h' | '3h' | 'always';
export type AgeFilter = '18-25' | '25-35' | '35-45' | 'all';
export type FemaleSafetyMode = 'off' | 'women_only' | 'verified_only' | 'nobody_first';

export type RequestStatus = 'none' | 'sent' | 'received' | 'accepted' | 'declined';

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

interface PendingRequest {
  userId: string;
  type: IcebreakerType;
  direction: 'sent' | 'received';
  status: RequestStatus;
  createdAt: number;
}

const DAILY_REQUEST_LIMIT_FREE = 10;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — storage disabled or quota exceeded
  }
}

function safeParse<T>(str: string | null, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getRequests(): PendingRequest[] {
  return safeParse<PendingRequest[]>(safeGet('nearby_requests'), []);
}

function setRequests(reqs: PendingRequest[]) {
  safeSet('nearby_requests', JSON.stringify(reqs));
  window.dispatchEvent(new Event('nearby_updated'));
}

function getAccepted(): string[] {
  return safeParse<string[]>(safeGet('nearby_accepted'), []);
}

function setAccepted(ids: string[]) {
  safeSet('nearby_accepted', JSON.stringify(ids));
  window.dispatchEvent(new Event('nearby_updated'));
}

function getDailyCount(): number {
  const key = safeGet('nearby_request_count_date');
  const count = parseInt(safeGet('nearby_request_count') || '0', 10);
  if (key !== todayKey()) return 0;
  return isNaN(count) ? 0 : count;
}

function incrementDailyCount() {
  safeSet('nearby_request_count_date', todayKey());
  safeSet('nearby_request_count', String(getDailyCount() + 1));
}

export interface NearbySettings {
  radiusKm: RadiusKm;
  presence: PresenceDuration;
  mood: MoodStatus;
  ageFilter: AgeFilter;
  femaleSafetyMode: FemaleSafetyMode;
  isVerified: boolean;
}

const DEFAULT_SETTINGS: NearbySettings = {
  radiusKm: 10,
  presence: '1h',
  mood: 'want_to_chat',
  ageFilter: 'all',
  femaleSafetyMode: 'off',
  isVerified: false,
};

function getSettings(): NearbySettings {
  return safeParse<NearbySettings>(safeGet('nearby_settings'), DEFAULT_SETTINGS);
}

function setSettingsStorage(s: NearbySettings) {
  safeSet('nearby_settings', JSON.stringify(s));
  window.dispatchEvent(new Event('nearby_updated'));
}

/** Main hook: nearby user list, filtered by current settings, plus request/accept actions. */
export function useNearby() {
  const [settings, setSettingsState] = useState<NearbySettings>(() => getSettings());
  const [requests, setRequestsState] = useState<PendingRequest[]>(() => getRequests());
  const [accepted, setAcceptedState] = useState<string[]>(() => getAccepted());
  const [dailyCount, setDailyCount] = useState<number>(() => getDailyCount());

  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('unsupported');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  // Orbit is the only screen that uses this hook, so mounting it already
  // means the user actively opened Orbit — this does not fire on app load.
  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handle = () => {
      setSettingsState(getSettings());
      setRequestsState(getRequests());
      setAcceptedState(getAccepted());
      setDailyCount(getDailyCount());
    };
    window.addEventListener('nearby_updated', handle);
    return () => window.removeEventListener('nearby_updated', handle);
  }, []);

  const updateSettings = useCallback((patch: Partial<NearbySettings>) => {
    const next = { ...getSettings(), ...patch };
    setSettingsStorage(next);
  }, []);

  // Filter mock users by radius, age, and female-safety mode.
  // When we have a real device location, distance is computed with genuine
  // haversine math against each user's location (anchored relative to the
  // real device position + their stored bearing/distance). Without location
  // permission, we fall back to the static mock distanceKm so the screen
  // still works.
  const usersWithDistance = mockNearbyUsers.map((u) => {
    if (coords) {
      const userPoint = destinationPoint(coords.lat, coords.lon, u.bearingDeg, u.distanceKm);
      const liveDistanceKm = haversineDistanceKm(coords.lat, coords.lon, userPoint.lat, userPoint.lon);
      return { ...u, distanceKm: parseFloat(liveDistanceKm.toFixed(1)) };
    }
    return u;
  });

  const visibleUsers: NearbyUser[] = usersWithDistance.filter((u) => {
    if (u.distanceKm > settings.radiusKm) return false;
    if (settings.ageFilter !== 'all') {
      const [min, max] = settings.ageFilter.split('-').map(Number);
      if (u.age < min || u.age > max) return false;
    }
    if (settings.femaleSafetyMode === 'women_only' && u.genderForFilter !== 'female') return false;
    if (settings.femaleSafetyMode === 'verified_only' && !u.isVerified) return false;
    return u.mood !== 'invisible';
  });

  const requestStatusFor = (userId: string): RequestStatus => {
    if (accepted.includes(userId)) return 'accepted';
    const req = requests.find((r) => r.userId === userId);
    return req ? req.status : 'none';
  };

  const canSendRequest = dailyCount < DAILY_REQUEST_LIMIT_FREE || settings.isVerified;
  const requestsRemaining = Math.max(0, DAILY_REQUEST_LIMIT_FREE - dailyCount);

  const sendRequest = (userId: string, type: IcebreakerType) => {
    if (!canSendRequest) return false;
    const reqs = getRequests().filter((r) => r.userId !== userId);
    reqs.push({ userId, type, direction: 'sent', status: 'sent', createdAt: Date.now() });
    setRequests(reqs);
    incrementDailyCount();
    setDailyCount(getDailyCount());

    // Mock auto-response: the other user "accepts" after a short delay most of the time.
    const willAccept = Math.random() > 0.25;
    setTimeout(() => {
      if (willAccept) {
        const ids = getAccepted();
        if (!ids.includes(userId)) {
          ids.push(userId);
          setAccepted(ids);
        }
        const updated = getRequests().map((r) =>
          r.userId === userId ? { ...r, status: 'accepted' as RequestStatus } : r
        );
        setRequests(updated);
      } else {
        const updated = getRequests().map((r) =>
          r.userId === userId ? { ...r, status: 'declined' as RequestStatus } : r
        );
        setRequests(updated);
      }
    }, 2200);

    return true;
  };

  const acceptRequest = (userId: string) => {
    const ids = getAccepted();
    if (!ids.includes(userId)) {
      ids.push(userId);
      setAccepted(ids);
    }
    const updated = getRequests().map((r) =>
      r.userId === userId ? { ...r, status: 'accepted' as RequestStatus } : r
    );
    setRequests(updated);
  };

  const declineRequest = (userId: string) => {
    const updated = getRequests().map((r) =>
      r.userId === userId ? { ...r, status: 'declined' as RequestStatus } : r
    );
    setRequests(updated);
  };

  return {
    settings,
    updateSettings,
    visibleUsers,
    requestStatusFor,
    sendRequest,
    acceptRequest,
    declineRequest,
    canSendRequest,
    requestsRemaining,
    dailyLimit: DAILY_REQUEST_LIMIT_FREE,
    locationStatus,
    requestLocation,
  };
}
