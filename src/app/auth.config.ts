import { AuthConfig } from 'angular-oauth2-oidc';
import { environment } from 'src/environments/environment';

export const authCodeFlowConfig: AuthConfig = {
  issuer: environment.openIdAuthorityUrl,
  redirectUri: window.location.origin,
  clientId: environment.openIdClientId,
  responseType: 'code',
  scope: 'openid profile email',
  showDebugInformation: true,
  timeoutFactor: 0.01,
  requestAccessToken: true,
};
