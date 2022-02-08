export interface ServiceInformation {
  name: string;
  alias: string;
  mobsosIDs: { agentID: string; registrationTime?: number }[];
  // key is custom message type (such as SERVICE_CUSTOM_MESSAGE_42)
  serviceMessageDescriptions: ServiceMessageDescriptions;
}

export interface ServiceCollection {
  [key: string]: ServiceInformation;
}

export interface ServiceMessageDescriptions {
  [key: string]: string;
}

export interface ServicesFromMobSOS {
  [key: string]: MobSOSService;
}

export interface ServicesFromL2P {
  [key: string]: { name: string };
}
export interface MobSOSService {
  serviceAlias?: string;
  registrationTime?: number;
  serviceName: string;
}
