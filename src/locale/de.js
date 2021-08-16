export const translations = {
  shared: {
    pages: {
      dashboard: 'Dashboard',
      'manage-questionnaires': 'Fragebögen verwalten',
      'manage-requirements': 'Anforderungen verwalten',
      'success-modeling': 'Erfolgsmodellierung',
      'raw-edit': 'Direktbearbeitung',
      'add-community': 'Community hinzufügen',
    },
    elements: {
      'cancel-label': 'Cancel',
      'close-label': 'Schließen',
      'community-dropdown-label': 'Community',
      'error-label': 'Fehler',
      'loading-label': 'Lade',
      'no-label': 'Nein',
      'ok-label': 'OK',
      'save-label': 'Speichern',
      'yes-label': 'Ja',
    },
  },
  app: {
    'community-selector': {
      'select-community-hint':
        'Einloggen um eine Community auszuwählen',
      'your-groups-hint': 'Deine Gruppen',
      'foreign-groups-hint': 'Andere Gruppen',
      'pick-community-name': 'Wähle einen Gruppen Namen',
    },
    'language-selector': {
      'select-language': 'Sprache auswählen',
    },
    'expert-mode': {
      'switch-label': 'Expertenmodus',
    },
    update: {
      message:
        'Ein neue Version ist verfügbar. Neuladen zum Aktualisieren.',
      reload: 'Neuladen',
    },
  },
  'raw-edit': {
    measures: {
      'send-button': 'Speichern',
      'send-button-no-selected-group':
        'Bitte wähle eine Community in der Seitenleiste aus',
      'snackbar-success':
        'Die Messungen wurden erfolgreich gespeichert.',
      'snackbar-failure':
        'Die Messungen konnten nicht gespeichert werden.',
    },
    'success-models': {
      'select-application': 'Anwendung',
      'send-button': 'Speichern',
      'send-button-no-selected-group-or-application':
        'Bitte wähle eine Community und eine Anwendung aus',
      'snackbar-success':
        'Das Erfolgsmodell wurde erfolgreich gespeichert.',
      'snackbar-failure':
        'Das Erfolgsmodell konnte nicht gespeichert werden.',
    },
    tabs: {
      'success-models': 'Erfolgsmodelle',
      measures: 'Messungen',
    },
  },
  'success-dimension': {
    'add-factor-dialog': {
      title: 'Faktor hinzufügen',
      'factor-input-placeholder': 'Faktorname',
    },
    'add-factor-tooltip': 'Faktor hinzufügen',
    'remove-factor-prompt':
      'Bist du sicher, dass du diesen Faktor entfernen möchtest?',
    'remove-factor-tooltip': 'Faktor entfernen',
  },
  'success-factor': {
    'add-measure-button': 'Messung hinzufügen',
    'no-measures-placeholder':
      'Dieser Faktor hat noch keine Messungen.',
    'remove-measure-prompt':
      'Best du sicher, dass dudie Messung entfernen möchtest?',
    'remove-measure-tooltip': 'Messung entfernen',
  },
  'success-modeling': {
    visualization: {
      'fetch-info':
        'Die Daten wurden am {{date}} vom Server geladen.',
      'fetch-error':
        ' Folgender Fehler ist beim Laden von rezenteren Daten aufgetreten: {{ error }}',
      'refresh-data': 'Neu laden',
    },
    'community-workspace':
      'Arbeitsbereich der {{community}} Community',
    'community-success-model':
      'Erfolgs Modell vom {{service}} Service',
    'copy-workspace-prompt':
      'Bist du sicher, dass du dein derzeitiges Modell ersetzen möchtest?',
    dimensions: {
      name: {
        'community-impact': 'Community-Auswirkung',
        'individual-impact': 'Individuelle Auswirkung',
        'user-satisfaction': 'Benutzerzufriedenheit',
        'system-quality': 'Systemqualität',
        'information-quality': 'Informationsqualität',
        use: 'Verwendung',
      },
      description: {
        'system-quality': 'Wie gut funktioniert die Technik?',
        'information-quality':
          'Wie zutreffend/vollständig sind die angezeigten Informationen?',
        use: 'Wie oft wird diese Anwendung verwendet?',
        'user-satisfaction':
          'Wie gerne wird diese Anwendung verwendet?',
        'individual-impact':
          'Wie sehr wirkt sich diese Anwednung auf Individuen aus?',
        'community-impact':
          'Wie sehr wirkt sich diese Anwednung auf die ganze Community aus?',
      },
    },
    'discard-changes-prompt': 'Änderungen verwerfen?',
    'edit-mode-toggle': 'Bearbeiten',
    'edit-disabled-tooltip':
      'Zum Bearbeiten musst du ein Mitglied der ausgewählten Community sein',
    'no-group-selected': 'Bitte wähle zuerst eine Community aus',
    'edit-measure-dialog': {
      'add-operation': 'Operation hinzufügen',
      'add-query': 'Abfrage hinzufügen',
      'choice-barchart': 'Balkendiagramm',
      'choice-chart': 'Diagramm',
      'choice-kpi': 'KPI',
      'choice-linechart': 'Liniendiagramm',
      'choice-piechart': 'Kuchendiagramm',
      'choice-radarchart': 'Netzdiagramm',
      'choice-value': 'Wert',
      'name-placeholder': 'Name',
      'description-placeholder':
        'Hier kannst du eine nähere Beschreibung deiner Visualisierung geben',
      'preview-title': 'Vorschau',
      'query-name-placeholder': 'Abfragenname',
      'query-placeholder': 'SQL',
      'remove-operation': 'Operation entfernen',
      'remove-query': 'Abfrage entfernen',
      'title-create': 'Neue Messung',
      'title-edit': 'Messung bearbeiten',
      'unit-placeholder': 'Einheit',
      'visualization-select': 'Visualisierung',
    },
    'edit-tooltip':
      'Erstelle oder bearbeite das Erfolgsmodell für diese Applikation',
    info: {
      'workspace-ask-owner-to-save':
        'Um Änderungen für alle zu speichern, musst du den Besitzer des Arbeitbereichs fragen, ob er den Speichern-Button für dich drückt.',
      'own-workspace':
        'Das ist dein eigener Arbeitsbereich. Du kannst das Erfolgsmodell nach deinen Wünschen anpassen und den Speichern-Button am Ende der Seite drücken.',
      'workspace-of': 'Das ist der Arbeitsbereich von ',
      'workspace-rights-editor':
        'Du kannst eigene Änderungen am Erfolgsmodell vornehmen.',
      'workspace-rights-spectator':
        'Du kannst Änderungen von Anderen beobachten, aber selbst keine Änderungen vornehmen.',
      'shared-by': 'hat dieses Erfolgsmodell mit dir geteilt',
      'username-required':
        'Du brauchst einen Nutzernamen um beizutreten',
      'pick-username': 'Wähle einen Nutzernamen aus',
      username: 'Benutzername',
      join: 'Beitreten',
      'continue-as-visitor': 'Als Gast beitreten',
      'sign-in':
        'Falls du einen las2peer <strong>account</strong> besitzt, nutze den Login oben rechts.',
      'joined-as-visitor':
        '{{owner}} hat dieses Erfolgsmodell mit dir geteilt. Du kannst Änderungen von Anderen beobachten, aber selbst keine Änderungen vornehmen. Frag {{owner}} ob er dich zur Community einladen kann, um selbst Änderungen vorzunehmen.',
    },
    'message-no-application-selected':
      'Es ist keine Anwendung ausgewählt. Bitte wähle oben eine aus, um das Erfolgsmodell zu sehen.',
    'message-no-success-model-found':
      'Es wurd kein Erfolgsmodell gefunden. Du kannst oben den Editiermodus aktivieren um eins zu erstellen.',
    'message-no-success-model-found-not-member':
      'Es wurd kein Erfolgsmodell gefunden. Du musst Mitglied der ausgewählten Community sein, um ein Modell erstellen zu können.',
    'pick-measure-dialog': {
      'create-measure-button': 'Messung erstellen',
      'no-measures':
        'Es sind keine Messungen vorhanden. Erstelle eine Messung mit dem obigen Button.',
      title: 'Wähle eine Messung aus',
    },
    questionnaires: {
      'add-questionnaire-tooltip':
        'Füge einen Fragebogen hinzu. Der Fragebogen kann nach dem Speichern ausgefüllt werden.',
      'delete-questionnaire-dialog': {
        'delete-measures': 'Generierte Messungen löschen.',
        'delete-survey':
          'Umfrage löschen. Die Ergebnisse bleiben erhalten.',
        text: 'Bist du sicher, dass du den Fragebogen entfernen möchtest?',
        title: 'Fragenbogen entfernen?',
      },
      'no-questionnaires':
        'Du hast noch keine Fragebögen ausgewählt. ',
      'activate-edit':
        'Aktiviere den Bearbeitungsmodus um welche hinzuzufügen.',
      'pick-questionnaire-dialog': {
        'add-measures':
          'Automatisch Messungen für die Antworten hinzufügen.',
        'assign-measures':
          'Hinzugefügte Messungen automatisch im Erfolgsmodell einfügen.',
        description: 'Beschreibung',
        dimensions: 'Dimensionen',
        language: 'Sprache',
        'num-questions': 'Anzahl der Fragen',
        'pick-questionnaire-to-see-description':
          'Wähle einen Fragebogen aus, um die Beschreibung zu sehen. Bereits verwendete Fragebögen können nicht mehr ausgewählt werden.',
        'questionnaire-select': 'Fragebogen',
        title: 'Fragebogenauswahl',
      },
      'remove-questionnaire-tooltip': 'Fragebogen entfernen',
      subtitle:
        'Erhalte Benutzerfeedback durch Fragebögen. Die generierten Daten können im Erfolgsmodell verwendet werden.',
      title: 'Fragebögen',
    },
    reqbaz: {
      tooltip: 'Bearbeite Anforderungen aus dem Requirements Bazaar',
    },
    'requirements-list': {
      'become-lead': 'Leitung übernehmen',
      'connect-project': 'Projekt verbinden',
      'disconnect-project': 'Projekt trennen',
      'disconnect-project-prompt':
        'Bist du sicher, dass du das Project vom Model trennen möchtest?',
      heading: 'Anforderungen vom Requirements Bazaar',
      'no-project':
        'Dieses Modell ist zur Zeit mit keinem Projekt aus dem Requirements Bazaar verbunden. Klicke den Button um Anforderungen bearbeiten zu können.',
      'pick-reqbaz-project': {
        'category-placeholder':
          'Suche eine Kategorie des Projekts...',
        'project-placeholder': 'Suche Projekt...',
        title: 'Projekt und Kategorie auswählen',
      },
      'realize-requirement': 'Fertig',
      'stop-lead': 'Leitung abgeben',
      'unrealize-requirement': 'Öffnen',
      'view-requirement': 'Ansehen',
    },
    'save-model-button': 'Modell speichern',
    'select-application': 'Anwendung wechseln',
    'snackbar-save-failure':
      'Das Erfolosmodell konnte nicht gespeichert werden.',
    'snackbar-save-success':
      'Das Erfolosmodell wurde erfolgreich gespeichert.',
    visitors: {
      'edit-role-description': 'Bearbeitung erlauben',
      heading: 'Besucher',
      'no-visitors': 'Keine Besucher',
      'spectator-role-description': 'Nur Ansehen erlauben',
      tooltip: 'Zeige wer dir beim Modellieren zusieht',
    },
    'workspace-closed-message':
      'Der Besitzer hat den Arbeitsbereich geschlossen.',
    workspaces: {
      'share-workspace':
        'Teile einen Link von deinem momentanen Arbeitsbereich',
      'copy-workspace': 'Arbeitsbereich kopieren',
      'go-to': 'Zum Arbeitsbereich gehen',
      heading: 'Arbeitsbereiche',
      'no-workspaces': 'Keine anderen Arbeitsbereiche',
      tooltip:
        'Zeige wer an einem Modell für die selbe Applikation arbeitet',
      'your-workspace': 'Du',
    },
  },
  'not-logged-in': 'Logge dich ein um diese App zu nutzen',
  'not-part-of-selected-community':
    'Du bist leider nicht Teil der {{ community }} Community',
  'copied-to-clipboard':
    'Der Link wurde kopiert. Du kannst ihn nun mit anderen Nutzern teilen',
};
