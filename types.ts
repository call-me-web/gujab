import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface Album {
  id: string;
  created_at: string;
  title: string;
  description?: string;
  cover_image?: string;
  user_id: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  website?: string;
  created_at?: string;
}

export interface Article {
  id: string;
  created_at?: string;
  headline: string;
  subhead: string;
  author: string;
  date: string;
  content: string;
  image?: string;
  tags: string[];
  link?: string;
  category: 'Politics' | 'Tech' | 'Celebrity' | 'Gossip' | 'Finance' | 'Creative Art' | 'World' | 'Lifestyle' | 'Science' | 'Sports' | 'Satire';
  liked_by: string[] | null;
  user_id: string;
  album_id?: string;
  albums?: Album; // Joined data
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface SearchResult {
  text: string;
  sources: GroundingChunk[];
}

export interface Tip {
  id: string;
  created_at: string;
  alias: string;
  subject: string;
  tip: string;
  image_url?: string;
  name?: string;
  email?: string;
}

export interface Announcement {
  id: string;
  created_at: string;
  message: string;
  is_active: boolean;
}

export interface DashboardStats {
  totalArticles: number;
  totalLikes: number;
  totalTips: number;
  activeNotices: number;
  avgLikesPerStory: string;
}

export type User = SupabaseUser;

export enum Page {
  HOME = 'HOME',
  CONTACT = 'CONTACT',
  ARCHIVE = 'ARCHIVE',
  DASHBOARD = 'DASHBOARD',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  AUTH = 'AUTH',
  ARTICLE_DETAIL = 'ARTICLE_DETAIL',
  SEARCH = 'SEARCH',
  ABOUT = 'ABOUT',
  POLICY = 'POLICY',
  BOOK_VIEW = 'BOOK_VIEW',
  PROFILE = 'PROFILE',
  DONATE = 'DONATE'
}

export interface WeatherData {
  temp: number;
  condition: string;
}

export type PublicationEdition =
  | 'TOP_OF_HOUR'
  | 'TOP_OF_DAY'
  | 'TOP_OF_WEEK'
  | 'TOP_OF_MONTH'
  | 'ALL_TIME_CLASSICS'
  | 'STANDARD_GRAVITY';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}