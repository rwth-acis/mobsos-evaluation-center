<p align="center">
  <img src="https://raw.githubusercontent.com/rwth-acis/las2peer/master/img/logo/bitmap/las2peer-logo-128x128.png" />
</p>
<h1 align="center">Mobsos Evaluation Center</h1>
<p align="center">
  <a href="https://travis-ci.org/rwth-acis/mobsos-evaluation-center" alt="Travis Build Status">
        <img src="https://travis-ci.org/rwth-acis/mobsos-evaluation-center.svg?branch=master" /></a>
</p>

This is a Web frontend for [MobSOS](https://github.com/rwth-acis/mobsos), a framework for community information systems (CIS) success awareness.

Its features include:
* Creating success models for each las2peer service used by your community
* Collaboratively editing success models with other community members
* Setting up questionnaire evaluation

# Dependencies

The following services need to be available for this frontend to work. Make sure they are running in your network.
## MobSOS Success Modeling

[MobSOS Success Modeling](https://github.com/rwth-acis/mobsos-success-modeling). This service handles most functionalities such as success modeling. Furthermore it also provides service information as well as information about communities in the network.

## Las2peer Contact Service

[las2peer-Contact-Service](https://github.com/rwth-acis/las2peer-contact-service).
This service is required in order to add new groups.

## MobSOS Query Visualization

[MobSOS Query Visualization](https://github.com/rwth-acis/mobsos-query-visualization). This service is required to fetch the data needed to generate visualizations of success measures of your success models.

# Configuration

On your first run make sure to run `npm install` first.

Edit the variables in `src/environments/environment.ts` to configure your development environment and `src/environments/environment.prod.ts` for the productive build.

The following variables need to be configured:
| Property | Explanation |
| ------------------------------ | ----------------- |
| openIdClientId | Client id for the login, for local testing you should use `localtestclient` |
| openIdSilentLoginInterval | Interval at which the app should perform a silent login |
| las2peerWebConnectorUrl | The url of the WebConnector in which the required MobSOS services are running |
| mobsosSurveysUrl | The url  at which mobsosSurveys is accessible |
| useLas2peerServiceDiscovery | If your network uses service discovery, you can set this to true |
| reqBazUrl | Url a which the Requirements Bazar API is accessible |
| reqBazFrontendUrl | Url a which the Requirements Bazar frontend is accessible |

# Working with Angular

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
