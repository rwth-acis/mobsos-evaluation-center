/**
 * Information about a service in the las2peer network
 */
export interface ServiceInformation {
  name: string; // Name of the service
  alias: string; // Alias of the service
  mobsosIDs: MobSOSIDs; // MobSOS IDs and their last registrationTime
  serviceMessageDescriptions: ServiceMessageDescriptions; // message descriptions for the service
}

export interface MobSOSIDs {
  [key: string]: number; // MobSOS ID and its last registrationTime
}
/**
 * A collection of services available in the las2peer network. The key is the name of the service
 */
export interface ServiceCollection {
  [key: string]: ServiceInformation; // Name of the service and its information
}

export interface ServiceMessageDescriptions {
  [key: string]: string; // Message description for the service
}
/**
 * Services from mobsos
 */
export interface ServicesFromMobSOS {
  [key: string]: MobSOSService; // MobSOS ID and its service
}
/**
 * Services from Las2peer
 */
export interface ServicesFromL2P {
  [key: string]: {
    name: string;
    releases: {
      [key: string]: { supplement: { class: string; name: string } };
    };
  }; // L2P ID and its service
}
/**
 * Service information from MobSOS
 */
export interface MobSOSService {
  serviceAlias?: string; // Alias of the service
  registrationTime?: number; // Registration time of the service
  serviceName: string; // Name of the service
}
