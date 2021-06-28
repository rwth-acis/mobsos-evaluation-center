export interface User {
  profile: { sub: string; preferred_username: string };
  access_token: string;
  session_state?: string;
  id_token?: string;
  signedIn?: boolean;
  visiting?: boolean;
}

export class Visitor {
  constructor(public username: string, public role: UserRole) {}
}

export enum UserRole {
  SPECTATOR = 'spectator',
  EDITOR = 'editor',
  LURKER = 'lurker',
}
