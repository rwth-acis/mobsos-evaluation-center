<p align="center">
  <img src="https://raw.githubusercontent.com/rwth-acis/las2peer/master/img/logo/bitmap/las2peer-logo-128x128.png" />
</p>
<h1 align="center">Mobsos Evaluation Center</h1>
<p align="center">
  <a href="https://github.com/rwth-acis/mobsos-evaluation-center/actions" alt="Build Status">
        <img src="https://github.com/rwth-acis/mobsos-evaluation-center/actions/workflows/docker-CI.yml/badge.svg" /></a>
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

## YJS websocket
This service is needed if you want to enable collaboration features.
The service can be started using `npm run start-yjs`.

Edit the variables in `src/environments/environment.ts` to configure your development environment and `src/environments/environment.prod.ts` for the production build.

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
| production | Set this to true for the production build. If this is set to false then experimental features are enabled |


# Working with Angular

## Development server

Run `npm install` to fetch the dependencies.

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.


## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Modules
There are certain modules which are used accross the application which you should also use in your own components, such as:

#### Translation module
This module is used to translate the app into german and english. In your template you should use the `translate` pipe to provide translations. The actual translations are loaded from the `src/locale/*` json files. 

For more info visit: [ngx-translate/core](https://github.com/ngx-translate/core)

#### NGRX Store
This module manages the state of the application. It is inspired by Redux. The store manages the state in a single object, which is immutable. 

If you want to change a value in the object you define an [Action](https://ngrx.io/guide/store/actions). Actions should be as simple as possible for more complex workflows consider using Effects.
Define your actions in `src\app\services\store.actions.ts`. 
The action requires a name which is a string. The names should be added to the one of the enums (`HttpActions,StateActions,StoreActions`). Note that the enums and their string values need to be unique. Otherwise an Action might unintentionally trigger another action.

The action itself is created using the `createAction` function. You can pass along required properties using the `props` function. Example: 
```js
export enum HttpActions {
  // ...
  ACTION_NAME = 'give a description here'
}

export const actionA = createAction(
  HttpActions.ACTION_NAME,
  props<{
    // add your properties here as key:value pairs
  }>(),
);
```

The [Reducers](https://ngrx.io/guide/store/reducers) listen to those actions being dispatched. If a particular action is dispatched, then the reducers modify the state by copying the old state and then adjusting the values. You can add your own listeners in the `src\app\services\store.reducer.ts` file by adding it to the `createReducer` function using the `on` function. Example: 
```js
const _Reducer = createReducer(
  initialState,
  // ...
  on(Actions.actionA, (state,props) => ({
    ...state,
    // update the values of the state here
    // you can use the props defined in your action
  })),
```


Import the store in your component and subscribe to it to get the changes. You can dispatch actions using the `dispatch` function.
Example:
```js
import { Store } from '@ngrx/store';
...
constructor(private ngrxStore:Store){}


ngOnInit(){
  this.ngrxStore.subscribe(callbackFn)
}
```

[Selectors](https://ngrx.io/guide/store/selectors) can help you to select particular values in the state. They take as input the state of the store and return any value. They can be added to the `src\app\services\store.selectors.ts` file. 
Example:
```js
export const SELECTOR_A = (state:StoreState) =>  state.Reducer.someProperty;
```
Selectors can be combined using the `createSelector` function. The function takes as a first argument a selector and as a second argument a callback function. It returns the return value of the callback function. Example:
```js
export const SELECTOR_B = createSelector(SELECTOR_A, (someProperty) =>
  someProperty.someSubProperty,
);
```
You can select parts of the state in your component by using the `select` function. Example:
```js
import { Store } from '@ngrx/store';
...
constructor(private ngrxStore:Store){}


ngOnInit(){
  this.ngrxStore.select(SELECTOR_A).subscribe(callbackFn)
}
```

[Effects](https://ngrx.io/guide/component-store/effect) can be used to model more complex workflows. Effects listen for Actions, and transform them into another action. Furthermore, you can use it to triggered multiple actions from a single action. 
Example: 
```js
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
@Injectable()
export class StateEffects {
...
constructor(
    private actions$: Actions,
    private ngrxStore: Store,
  ) {}
effect$ = createEffect(() =>
    this.actions$.pipe( 
      ofType(Action.ACTION_A), // filter actions by ACTION_A
      tap((action) => {
        // use this to dispatch other actions, you can use the props from the action
      }),
      switchMap((action) => 
        // make http calls here
        // transforms the effect onto an http call and then once the request has finished, a new Action ACTION_B
        // you can use the props from the action
        this.http.get(url).pipe(map(content=>Action.ACTION_B))
      ),
      catchError((err) => {
        console.error(err);
        return of(Action.failure());
        // catching errors is important to keep effects from working even after an error occured
      }),
      share(), // share is used here so that we can subscribe to the effect in other components without dispatching a new Action
    ),
  );
}
```
For more info visit: [@ngrx/store](https://ngrx.io/guide/store)
## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use `--configuration production` to build for production. 

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
