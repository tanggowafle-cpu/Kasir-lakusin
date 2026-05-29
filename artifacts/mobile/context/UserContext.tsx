import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '@clerk/expo';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types';

interface UserContextType {
  profile: UserProfile | null;
  profileLoading: boolean;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
  createInitialProfile: (data: {
    namaLengkap: string;
    namaWarung: string;
    nomorWhatsapp: string;
  }) => Promise<void>;
  isTrialExpired: boolean;
  daysRemaining: number;
}

const UserContext = createContext<UserContextType>({} as UserContextType);

function profileKey(clerkId: string) {
  return `@lakusin/profile/${clerkId}`;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    (async () => {
      setProfileLoading(true);
      try {
        const raw = await AsyncStorage.getItem(profileKey(user.id));
        if (raw) {
          const p: UserProfile = JSON.parse(raw);
          const now = new Date();
          const expired = new Date(p.tanggalExpired);
          if (p.statusAkun === 'trial' && now > expired) {
            p.statusAkun = 'expired';
            await AsyncStorage.setItem(profileKey(user.id), JSON.stringify(p));
          }
          setProfile(p);
        } else {
          setProfile(null);
        }
      } catch {
        setProfile(null);
      }
      setProfileLoading(false);
    })();
  }, [user, isLoaded]);

  const saveProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...profile, ...data } as UserProfile;
    setProfile(updated);
    await AsyncStorage.setItem(profileKey(user.id), JSON.stringify(updated));
  }, [user, profile]);

  const createInitialProfile = useCallback(async (data: {
    namaLengkap: string;
    namaWarung: string;
    nomorWhatsapp: string;
  }) => {
    if (!user) return;
    const now = new Date();
    const expired = new Date(now);
    expired.setDate(expired.getDate() + 14);
    const p: UserProfile = {
      clerkId: user.id,
      namaLengkap: data.namaLengkap,
      email: user.primaryEmailAddress?.emailAddress ?? '',
      namaWarung: data.namaWarung,
      nomorWhatsapp: data.nomorWhatsapp,
      statusAkun: 'trial',
      paket: 'basic',
      tanggalMulai: now.toISOString(),
      tanggalExpired: expired.toISOString(),
    };
    setProfile(p);
    await AsyncStorage.setItem(profileKey(user.id), JSON.stringify(p));
  }, [user]);

  const isTrialExpired = profile?.statusAkun === 'expired';

  const daysRemaining = (() => {
    if (!profile) return 0;
    if (profile.statusAkun === 'expired') return 0;
    const diff = new Date(profile.tanggalExpired).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  return (
    <UserContext.Provider value={{ profile, profileLoading, saveProfile, createInitialProfile, isTrialExpired, daysRemaining }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserContext);
}
