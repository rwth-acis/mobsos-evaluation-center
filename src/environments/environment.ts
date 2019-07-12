// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  openIdAuthorityUrl: 'https://api.learning-layers.eu/o/oauth2',
  openIdClientId: 'f8622260-875b-499a-82db-db55f89f9deb',
  // las2peerWebConnectorUrl: 'https://cloud10.dbis.rwth-aachen.de:8084',
  las2peerWebConnectorUrl: 'http://127.0.0.1:8080',
  mobsosSurveysUrl: 'http://127.0.0.1:8080/mobsos-surveys/',
  servicePollingInterval: 60,
  visualizationRefreshInterval: 60,
  // enable to use the blockchain based service discovery of las2peer
  useLas2peerServiceDiscovery: false,
  // yJsWebsocketUrl: 'wss://cloud10.dbis.rwth-aachen.de:8089',
  yJsWebsocketUrl: 'ws://localhost:1234',
  // URL of the Requirements Bazaar API
  reqBazUrl: 'https://requirements-bazaar.org/bazaar',
  // URL of the Requirements Bazaar frontend
  reqBazFrontendUrl: 'https://requirements-bazaar.org/',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error';  // Included with Angular CLI.
