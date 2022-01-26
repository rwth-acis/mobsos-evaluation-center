// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

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
    window?.env?.openIdClientId || 'www.localclient.com',
  openIdSilentLoginInterval: 60,
  las2peerWebConnectorUrl:
    window.env.las2peerWebConnectorUrl ||
    'https://git.tech4comp.dbis.rwth-aachen.de',
  mobsosSurveysUrl:
    window.env.mobsosSurveysUrl ||
    'https://git.tech4comp.dbis.rwth-aachen.de/mobsos-surveys',
  visualizationRefreshInterval: 5,
  useLas2peerServiceDiscovery: false,
  yJsWebsocketUrl:
    window.env.yJsWebsocketUrl ||
    'wss://tech4comp.dbis.rwth-aachen.de/yjs-websocket',
  reqBazUrl: 'https://requirements-bazaar.org/bazaar',
  reqBazFrontendUrl: 'https://requirements-bazaar.org/',
  mobsosSurveysDatabaseName: 'mobsos',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error'; // Included with Angular CLI.import { Environment } from './environment.model';
import { Environment } from './environment.model';
