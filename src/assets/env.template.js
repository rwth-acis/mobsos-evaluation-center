(function (window) {
  window.env = window.env || {};
  // Environment variables
  window['env']['las2peerWebConnectorUrl'] = '${BOOTSTRAP}';
  window['env']['yJsWebsocketUrl'] = '${Y_WEBSOCKET}';
  window['env']['openIdClientId'] = '${OIDC_CLIENT_ID}';
  window['env']['production'] = '${PRODUCTION}';
})(this);
