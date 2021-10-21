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

export const environment = {
  production: false,
  // set to true if the timestamps coming from the MobSOS database are in local time and not UTC
  correctTimestamps: false,
  openIdAuthorityUrl: 'https://api.learning-layers.eu/o/oauth2',
  openIdClientId:
    window?.env?.openIdClientId || 'www.localclient.com',
  openIdSilentLoginInterval: 60, // interval in seconds to silently sign in the user
  // las2peerWebConnectorUrl: 'https://cloud10.dbis.rwth-aachen.de:8084',
  las2peerWebConnectorUrl:
    'https://git.tech4comp.dbis.rwth-aachen.de',
  mobsosSurveysUrl:
    'https://git.tech4comp.dbis.rwth-aachen.de/mobsos-surveys',
  // mobsosSurveysUrl: 'http://127.0.0.1:8080/mobsos-surveys/',
  servicePollingInterval: 120,
  // interval at which visualizations should be refetched in minutes
  visualizationRefreshInterval: 30,
  // enable to use the blockchain based service discovery of las2peer
  useLas2peerServiceDiscovery: false,

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
import 'zone.js/dist/zone-error'; // Included with Angular CLI.
