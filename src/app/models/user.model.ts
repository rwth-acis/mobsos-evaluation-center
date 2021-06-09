export interface User {
  profile: { sub: string; preferred_username: string };
  access_token: string;
  session_state?: string;
  id_token?: string;
  signedIn?: boolean;
}

export interface Visitor {
  username: string;
  role: string;
}

export enum UserRole {
  VISITOR = 'visitor',
  OWNER = 'owner',
}
