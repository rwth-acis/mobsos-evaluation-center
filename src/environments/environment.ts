// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

import packageInfo from '../../package.json';

declare global {
  interface Window {
    env: {
      las2peerWebConnectorUrl: string;
      yJsWebsocketUrl: string;
      openIdClientId: string;
      production: string;
      mobsosSurveysUrl?: string;
      limesurveyUrl?: string;
      limesurveyLoginName?: string;
      limesurveyPassword?: string;
    };
  }
}

export const environment: Environment = {
  production: false,
  correctTimestamps: false,
  openIdAuthorityUrl: 'https://api.learning-layers.eu/o/oauth2',
  openIdClientId: 'localtestclient',
  openIdSilentLoginInterval: 60,
  las2peerWebConnectorUrl:
    'https://git.tech4comp.dbis.rwth-aachen.de',
  mobsosSurveysUrl:
    'https://git.tech4comp.dbis.rwth-aachen.de/mobsos-surveys',
  visualizationRefreshInterval: 5,
  useLas2peerServiceDiscovery: false,
  yJsWebsocketUrl: 'ws://localhost:1234',
  reqBazUrl: 'https://requirements-bazaar.org/bazaar',
  reqBazFrontendUrl: 'https://requirements-bazaar.org/',
  mobsosSurveysDatabaseName: 'mobsos',
  version: packageInfo.version,
  limeSurveyProxyUrl:
    'https://las2peer.tech4comp.dbis.rwth-aachen.de/SurveyHandler',
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
