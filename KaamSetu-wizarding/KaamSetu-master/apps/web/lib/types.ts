export type Role = 'customer' | 'worker' | 'admin';

// Shape returned by the API's publicUser() in routes/auth.ts
export type User = {
  id: string;
  phone: string;
  name: string;
  role: Role | null;
  language: string;
  avatarUrl?: string;
  referralCode?: string;
  walletBalance: number;
};
