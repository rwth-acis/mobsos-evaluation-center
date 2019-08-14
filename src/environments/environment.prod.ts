export const environment = {
  production: true,
  // set to true if the timestamps coming from the MobSOS database are in local time and not UTC
  correctTimestamps: false,
  openIdAuthorityUrl: 'https://api.learning-layers.eu/o/oauth2',
  openIdClientId: 'f8622260-875b-499a-82db-db55f89f9deb',
  las2peerWebConnectorUrl: 'https://cloud10.dbis.rwth-aachen.de:8084',
  mobsosSurveysUrl: 'https://cloud10.dbis.rwth-aachen.de:8084/mobsos-surveys/',
  servicePollingInterval: 10,
  visualizationRefreshInterval: 10,
  // enable to use the blockchain based service discovery of las2peer
  useLas2peerServiceDiscovery: true,
  // URL of the y-js websocket server
  yJsWebsocketUrl: 'wss://cloud10.dbis.rwth-aachen.de:8089',
  // URL of the Requirements Bazaar API
  reqBazUrl: 'https://requirements-bazaar.org/bazaar',
  // URL of the Requirements Bazaar frontend
  reqBazFrontendUrl: 'https://requirements-bazaar.org/',
};
