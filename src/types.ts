export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  latest_message: string | null;
  updated_at: string;
}

export type Screen = 'welcome' | 'signup' | 'signin' | 'interaction';
