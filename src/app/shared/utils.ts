import { ServiceInformation } from '../models/service.model';

/**
 * Replace the $SERVICE$ placeholder in a query with the service agent ID of the currently selected service.
 * Replaces $SERVICES$ with a list of all service agent IDs of the currently selected service.
 * @param query  The query to replace the placeholders in
 * @param service  The currently selected service
 * @returns
 */
export function applyVariableReplacements(
  query: string,
  service: ServiceInformation,
): string {
  if (query?.includes('$SERVICES$')) {
    let servicesString = '(';
    const services = [];

    if (!service?.mobsosIDs) {
      console.error('Service agent id cannot be null');
      return query;
    }
    for (const mobsosID of Object.keys(service.mobsosIDs)) {
      services.push(`"${mobsosID}"`);
    }
    servicesString += services.join(',') + ')';
    return query?.replace('$SERVICES$', servicesString);
  } else if (query?.includes('$SERVICE$')) {
    if (!(Object.keys(service.mobsosIDs).length > 0)) {
      console.error('Service agent id cannot be null');
      return query;
    }
    // for now we use the id which has the greatest registrationTime as this is the agent ID
    // of the most recent service agent started in las2peer
    const maxIndex = Object.values(service.mobsosIDs).reduce(
      (max, time, index) => {
        return time > max ? index : max;
      },
      0,
    );

    return query?.replace(
      '$SERVICE$',
      ` ${Object.keys(service.mobsosIDs)[maxIndex]} `,
    );
  } else return query;
}

/**
 *  Returns a list of service agent IDs of the currently selected service.
 * @param query  The query to replace the placeholders in
 * @param service   The currently selected service
 * @returns
 */
export function getParamsForQuery(
  query: string,
  service: ServiceInformation,
): string[] {
  if (!(service?.mobsosIDs?.length > 0)) {
    // just for robustness
    // should not be called when there are no service IDs stored in MobSOS anyway
    return [];
  }
  const serviceRegex = /\$SERVICE\$/g;
  const matches = query?.match(serviceRegex);
  const params = [];
  if (matches) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const {} of matches) {
      // for now we use the id which has the greatest registrationTime as this is the agent ID
      // of the most recent service agent started in las2peer
      const maxIndex = Object.values(service.mobsosIDs).reduce(
        (max, time, index) => {
          return time > max ? index : max;
        },
        0,
      );

      params.push(Object.keys(service.mobsosIDs)[maxIndex]);
    }
  }
  return params as string[];
}
