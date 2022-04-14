import { UserRole } from './workspace.model';

export interface User {
  profile: {
    sub: string; // identifies the user
    preferred_username: string; // user name
  }; // User profile
  access_token: string; // Access token used to access las2peer services
  session_state?: string; // Session state. Only used for OIDC
  id_token?: string; // Id token. Not used at the moment
  signedIn?: boolean; // Is the user signed in?
  role?: UserRole; // User role
}
