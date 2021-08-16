export const translations = {
  shared: {
    pages: {
      dashboard: 'Dashboard',
      'manage-questionnaires': 'Manage Questionnaires',
      'manage-requirements': 'Manage Requirements',
      'success-modeling': 'Success Modeling',
      'raw-edit': 'Raw Edit',
      'add-community': 'Add Community',
    },
    elements: {
      'cancel-label': 'Cancel',
      'close-label': 'Close',
      'community-dropdown-label': 'Community',
      'error-label': 'Error',
      'loading-label': 'Loading',
      'no-label': 'No',
      'ok-label': 'OK',
      'save-label': 'Save',
      'yes-label': 'Yes',
    },
  },
  app: {
    'community-selector': {
      'select-community-hint': 'Login to select your community',
      'your-groups-hint': 'Your Groups',
      'foreign-groups-hint': 'Foreign Groups',
      'pick-community-name': 'Pick a unique community name',
    },
    'language-selector': {
      'select-language': 'Select Language',
    },
    'expert-mode': {
      'switch-label': 'Expert Mode',
    },
    update: {
      message: 'New version available. Reload to update.',
      reload: 'Reload',
    },
  },
  'raw-edit': {
    measures: {
      'select-application': 'Application',
      'send-button': 'Save',
      'send-button-no-selected-group':
        'Please pick a community on the side bar',
      'snackbar-success':
        'The measures have been saved successfully.',
      'snackbar-failure': 'The measures could not be saved.',
    },
    'success-models': {
      'select-application': 'Application',
      'send-button': 'Save',
      'send-button-no-selected-group-or-application':
        'Please pick a community and an application',
      'snackbar-success':
        'The success model has been saved successfully.',
      'snackbar-failure': 'The success model could not be saved.',
    },
    tabs: {
      'success-models': 'Success Models',
      measures: 'Measures',
    },
  },
  'success-dimension': {
    'add-factor-dialog': {
      title: 'Add Factor',
      'factor-input-placeholder': 'Factor Name',
    },
    'add-factor-tooltip': 'Add Factor',
    'remove-factor-prompt':
      'Are your sure you want to remove this factor?',
    'remove-factor-tooltip': 'Remove factor',
  },
  'success-factor': {
    'add-measure-button': 'Add Measure',
    'no-measures-placeholder':
      'This factor has no measures attached to it yet.',
    'remove-measure-prompt':
      'Are you sure you want to remove this measure?',
    'remove-measure-tooltip': 'Remove Measure',
  },
  'success-modeling': {
    visualization: {
      'fetch-info':
        'Showing data fetched on {{date}} from the server ',
      'fetch-error':
        ' The following error was encountered, while fetching more recent data: {{ error }}',
      'refresh-data': 'Refresh',
    },
    'community-workspace': 'Workspace of the {{community}} Community',
    'community-success-model':
      'Success Model for the {{service}} service ',
    'copy-workspace-prompt':
      'Are you sure you want to replace your current model?',
    dimensions: {
      name: {
        'system-quality': 'System Quality',
        'information-quality': 'Information Quality',
        use: 'Use',
        'user-satisfaction': 'User Satisfaction',
        'individual-impact': 'Individual Impact',
        'community-impact': 'Community Impact',
      },
      description: {
        'system-quality': 'How well does the technology work?',
        'information-quality':
          'How accurate/complete is the presented information?',
        use: 'How often is this application used?',
        'user-satisfaction':
          'How much do people like using this application?',
        'individual-impact':
          'How much does this application affect individuals?',
        'community-impact':
          'How much does this application affect the whole community?',
      },
    },
    'discard-changes-prompt': 'Discard changes?',
    'edit-mode-toggle': 'Edit',
    'no-group-selected':
      'No community was selected. Please make sure to select a community first',
    'edit-disabled-tooltip':
      'You must be a member of the selected community to edit',
    'edit-measure-dialog': {
      'add-operation': 'Add Operation',
      'add-query': 'Add Query',
      'choice-barchart': 'Bar Chart',
      'choice-chart': 'Chart',
      'choice-kpi': 'KPI',
      'choice-linechart': 'Line Chart',
      'choice-piechart': 'Pie Chart',
      'choice-radarchart': 'Radar Chart',
      'choice-value': 'Value',
      'name-placeholder': 'Name',
      'description-placeholder':
        'Describe your visualization here in more detail',
      'preview-title': 'Preview',
      'query-name-placeholder': 'Query Name',
      'query-placeholder': 'SQL',
      'remove-operation': 'Remove Operation',
      'remove-query': 'Remove Query',
      'title-create': 'Create Measure',
      'title-edit': 'Edit Measure',
      'unit-placeholder': 'Unit',
      'visualization-select': 'Visualization',
    },
    'edit-tooltip':
      'Create or edit the success model for this application',
    info: {
      'workspace-ask-owner-to-save':
        'To save changes for everybody you have to ask the owner of this workspace to hit the save button.',
      'own-workspace':
        'This is your own workspace. You can change the success model to your liking and press the save button at the bottom of the page.',
      'workspace-of': 'This is the workspace of ',
      'workspace-rights-editor':
        'You can make own changes to the success model.',
      'workspace-rights-spectator':
        'You can watch changes made by others, but not make changes yourself.',
      'shared-by': 'has shared this success model with you',
      'username-required':
        'A username is required to join this workspace.',
      'pick-username': 'Pick a username',
      username: 'Username',
      join: 'Join',
      'sign-in':
        ' If you have a las2peer <strong>account</strong> , use the login button in the top right corner.',
      'continue-as-visitor': ' Continue as Visitor',
      'joined-as-visitor':
        '{{owner}} has shared this success model with you. You can watch changes made by the community, but not make changes yourself. If you want to make changes you have to be logged in and be a part of the community',
    },
    'message-no-application-selected':
      'No application selected. Please select an application above to see its success model.',
    'message-no-success-model-found':
      'No success model present. You can enable the edit mode above and create one.',
    'message-no-success-model-found-not-member':
      'No success model present. You must be a member of the selected community to create a new model.',
    'pick-measure-dialog': {
      'create-measure-button': 'Create Measure',
      'no-measures':
        'No measures exist yet. Create one with the button above.',
      title: 'Pick a Measure',
    },
    questionnaires: {
      'add-questionnaire-tooltip':
        'Add a questionnaire. The questionnaire can be filled in after saving.',
      'delete-questionnaire-dialog': {
        'delete-measures': 'Delete generated measures.',
        'delete-survey':
          'Delete survey. Results will be still available.',
        text: 'Are you sure that you want to remove the questionnaire?',
        title: 'Remove Questionnaire?',
      },
      'no-questionnaires':
        'You have not picked any questionnaires yet.',
      'activate-edit': ' Activate the edit mode to add one.',
      'pick-questionnaire-dialog': {
        'add-measures':
          'Automatically add measures for questionnaire answers.',
        'assign-measures':
          'Insert added measures into the success model.',
        description: 'Description',
        dimensions: 'Dimensions',
        language: 'Language',
        'num-questions': 'Number of questions',
        'pick-questionnaire-to-see-description':
          'Pick a questionnaire to see its description. You can not pick questionnaires that are already used.',
        'questionnaire-select': 'Questionnaire',
        title: 'Pick a Questionnaire',
      },
      'remove-questionnaire-tooltip': 'Remove questionnaire',
      subtitle:
        'Get user feedback with questionnaires. The generated data can be used in the success model.',
      title: 'Questionnaires',
    },
    reqbaz: {
      tooltip: 'Edit requirements from the Requirements Bazaar',
    },
    'requirements-list': {
      'become-lead': 'Take Lead',
      'connect-project': 'Connect Project',
      'disconnect-project': 'Disconnect Project',
      'disconnect-project-prompt':
        'Are you sure that you want to disconnect the project from the model?',
      heading: 'Requirements from the Requirements Bazaar',
      'no-project':
        'This model is currently not connected to any Requirements Bazaar project. Click the button edit requirements.',
      'pick-reqbaz-project': {
        'category-placeholder': 'Search a Category of the Project...',
        'project-placeholder': 'Search Project...',
        title: 'Pick a Project and Category',
      },
      'realize-requirement': 'Done',
      'stop-lead': 'Yield Lead',
      'unrealize-requirement': 'Reopen',
      'view-requirement': 'View',
    },
    'save-model-button': 'Save Model',
    'select-application': 'Switch Application',
    'snackbar-save-failure': 'The success model could not be saved.',
    'snackbar-save-success':
      'The success model has been saved successfully.',
    visitors: {
      'edit-role-description': 'Allow editing',
      heading: 'Visitors',
      'no-visitors': 'No visitors',
      'spectator-role-description': 'Allow viewing only',
      tooltip: 'Show people watching you modelling',
    },
    'workspace-closed-message': 'The owner has closed the workspace.',
    workspaces: {
      'share-workspace': 'Share link to current workspace',
      'copy-workspace': 'Copy workspace',
      'go-to': 'Go to Workspace',
      heading: 'Workspaces',
      'no-workspaces': 'No other workspaces',
      tooltip:
        'See who else is working on a model for this application',
      'your-workspace': 'You',
    },
  },
  'not-logged-in': 'You need to be logged in to use this App',
  'not-part-of-selected-community':
    'You are not a member of the {{ community }} Community',
  'copied-to-clipboard':
    'The link has been copied to the clipboard. You can now share it with others',
};
