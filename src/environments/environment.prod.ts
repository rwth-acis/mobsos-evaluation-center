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
  production: window.env.production
    ? window.env.production.toLocaleLowerCase() === 'true'
    : true,
  // set to true if the timestamps coming from the MobSOS database are in local time and not UTC
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
    'https://surveys.tech4comp.dbis.rwth-aachen.de/mobsos-surveys/',
  servicePollingInterval: 10,
  // interval at which visualizations should be refetched from server
  visualizationRefreshInterval: 12 * 60,
  // enable to use the blockchain based service discovery of las2peer
  useLas2peerServiceDiscovery: true,
  // URL of the y-js websocket server
  yJsWebsocketUrl:
    window.env.yJsWebsocketUrl ||
    'ws://tech4comp.dbis.rwth-aachen.de/yjs-websocket',
  // URL of the Requirements Bazaar API
  reqBazUrl: 'https://requirements-bazaar.org/bazaar',
  // URL of the Requirements Bazaar frontend
  reqBazFrontendUrl: 'https://requirements-bazaar.org/',
};
