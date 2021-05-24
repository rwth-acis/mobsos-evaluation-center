export interface User {
  profile: { sub: string; preferred_username: string };
  access_token: string;
  session_state?: string;
  id_token?: string;
}

export interface Visitor {
  username: string;
  role: string;
}