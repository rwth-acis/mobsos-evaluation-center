import { environment } from 'src/environments/environment';

export const userManagerSettings = {
  authority: environment.openIdAuthorityUrl,
  client_id: environment.openIdClientId,
  redirect_uri: 'oidc-signin',
  response_mode: 'fragment' as 'query' | 'fragment',
};
