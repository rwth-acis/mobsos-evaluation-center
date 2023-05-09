import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { TranslateModule } from '@ngx-translate/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import {
  MatNativeDateModule,
  MatRippleModule,
} from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { ConfirmationDialogComponent } from './dialogs/confirmation-dialog/confirmation-dialog.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SqlTableComponent } from './sql-table/sql-table.component';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { AddCommunityDialogComponent } from './dialogs/add-community-dialog/add-community-dialog.component';
import { UnavailableServicesDialogComponent } from './dialogs/unavailable-services-dialog/unavailable-services-dialog.component';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { ImportDialogComponent } from './dialogs/import-dialog/import-dialog.component';
import { QuestionnaireInfoDialogComponent } from './dialogs/questionnaire-info-dialog/questionnaire-info-dialog.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ErrorBannerComponent } from './error-banner/error-banner.component';
import { VisualizationsModule } from './visualizations/visualizations.module';
import { InfoBannerComponent } from './info-banner/info-banner.component';
import { NgxPrintModule } from 'ngx-print';
@NgModule({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  declarations: [
    ConfirmationDialogComponent,
    SqlTableComponent,
    AddCommunityDialogComponent,
    UnavailableServicesDialogComponent,
    ImportDialogComponent,
    QuestionnaireInfoDialogComponent,
    ErrorBannerComponent,
    InfoBannerComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatDialogModule,
    FormsModule,
    MatCardModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatInputModule,
    MatIconModule,
    NgxPrintModule,
    MatTableModule,
    VisualizationsModule,
  ],
  exports: [
    MatSelectModule,
    MatTabsModule,
    MatChipsModule,
    TranslateModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatMenuModule,
    MatCardModule,
    MatSlideToggleModule,
    MatStepperModule,
    MatSortModule,
    MatPaginatorModule,
    NgxPrintModule,
    MatTableModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatExpansionModule,
    ReactiveFormsModule,
    MatRippleModule,
    MatAutocompleteModule,
    MatBadgeModule,
    MatTooltipModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatToolbarModule,
    MatSnackBarModule,
    FormsModule,
    SqlTableComponent,
    ErrorBannerComponent,
    InfoBannerComponent,
    VisualizationsModule,
  ],
})
export class SharedModule {}
