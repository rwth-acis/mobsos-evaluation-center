import { Environment } from './environment.model';
import packageInfo from '../../package.json';

declare global {
  interface Window {
    env: {
      las2peerWebConnectorUrl: string;
      yJsWebsocketUrl: string;
      openIdClientId: string;
      production: string;
      mobsosSurveysUrl?: string;
    };
  }
}

export const environment: Environment = {
  production: window.env.production
    ? window.env.production.toLocaleLowerCase() === 'true'
    : true,
  correctTimestamps: false,
  openIdAuthorityUrl: 'https://api.learning-layers.eu/o/oauth2',
  openIdClientId:
    window.env.openIdClientId ||
    'f8622260-875b-499a-82db-db55f89f9deb',
  openIdSilentLoginInterval: 60,
  las2peerWebConnectorUrl:
    window.env.las2peerWebConnectorUrl ||
    'https://las2peer.tech4comp.dbis.rwth-aachen.de',
  mobsosSurveysUrl:
    window.env.mobsosSurveysUrl ||
    'https://las2peer.tech4comp.dbis.rwth-aachen.de/mobsos-surveys',
  visualizationRefreshInterval: 12 * 60, // 12 hours
  useLas2peerServiceDiscovery: true,
  yJsWebsocketUrl:
    window.env.yJsWebsocketUrl ||
    'wss://tech4comp.dbis.rwth-aachen.de/yjs-websocket',
  reqBazUrl: 'https://requirements-bazaar.org/bazaar',
  reqBazFrontendUrl: 'https://requirements-bazaar.org/',
  mobsosSurveysDatabaseName: 'mobsos',
  version: packageInfo.version,
  limeSurveyProxyUrl: null,
};
