declare global {
  interface Window {
    env: {
      las2peerWebConnectorUrl: string;
      yJsWebsocketUrl: string;
      openIdClientId: string;
      production:boolean
    };
  }
}

export const environment = {
  production: window.env.production || true,
  // set to true if the timestamps coming from the MobSOS database are in local time and not UTC
  correctTimestamps: false,
  openIdAuthorityUrl: 'https://api.learning-layers.eu/o/oauth2',
  openIdClientId:
    window.env.openIdClientId || 'f8622260-875b-499a-82db-db55f89f9deb',
  openIdSilentLoginInterval: 60,
  las2peerWebConnectorUrl:
    window.env.las2peerWebConnectorUrl ||
    'https://las2peer.tech4comp.dbis.rwth-aachen.de',
  mobsosSurveysUrl:
    'https://las2peer.tech4comp.dbis.rwth-aachen.de/mobsos-surveys/',
  servicePollingInterval: 60,
  visualizationRefreshInterval: 60,
  // enable to use the blockchain based service discovery of las2peer
  useLas2peerServiceDiscovery: true,
  // URL of the y-js websocket server
  yJsWebsocketUrl: window.env.yJsWebsocketUrl || 'wss://localhost:8089',
  // URL of the Requirements Bazaar API
  reqBazUrl: 'https://requirements-bazaar.org/bazaar',
  // URL of the Requirements Bazaar frontend
  reqBazFrontendUrl: 'https://requirements-bazaar.org/',
};
