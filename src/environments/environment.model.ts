export interface Environment {
  production: boolean; // set to true if the timestamps coming from the MobSOS database are in local time and not UTC
  correctTimestamps: boolean; // true if the timestamps coming from the MobSOS surveys database are in local time and not UTC
  openIdAuthorityUrl: string; // URL of the OpenID Connect server
  openIdClientId: string; // client id of the las2peer web connector
  openIdSilentLoginInterval: number; // interval in seconds to silently sign in the user
  las2peerWebConnectorUrl: string; // URL of the las2peer web connector
  mobsosSurveysUrl: string; // URL of the MobSOS surveys
  mobsosSurveysDatabaseName: string; // name of the MobSOS surveys database
  visualizationRefreshInterval: number; // interval in minutes for how long visualizations should be cached
  useLas2peerServiceDiscovery: boolean; // enable to use the blockchain based service discovery of las2peer
  yJsWebsocketUrl: string; // URL of the yjs websocket
  reqBazUrl: string; // URL of the Requirements Bazaar API
  reqBazFrontendUrl: string; // URL of the Requirements Bazaar frontend
}
