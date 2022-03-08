/**
 * Information about a service in the las2peer network
 */
export interface ServiceInformation {
  name: string;
  alias: string;
  mobsosIDs: MobSOSIDs; // MobSOS IDs and their last registrationTime
  serviceMessageDescriptions: ServiceMessageDescriptions; // message descriptions for the service
}

export interface MobSOSIDs {
  [key: string]: number;
}
/**
 * A collection of services available in the las2peer network. The key is the name of the service
 */
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
