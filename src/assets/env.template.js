(function (window) {
  window.env = window.env || {};
  // Environment variables
  window['env']['las2peerWebConnectorUrl'] = '${BOOTSTRAP}';
  window['env']['yJsWebsocketUrl'] = '${Y_WEBSOCKET}';
  window['env']['openIdClientId'] = '${OIDC_CLIENT_ID}';
  window['env']['production'] = '${PRODUCTION}';
  window['env']['mobsosSurveysUrl'] = '${SURVEYS_URL}';
  window['env']['limesurveyUrl'] = '${LIMESURVEY_URL}';
  window['env']['limesurveyLoginName'] = '${LIMESURVEY_LOGIN_NAME}';
  window['env']['limesurveyPassword'] = '${LIMESURVEY_PASSWORD}';
})(this);
