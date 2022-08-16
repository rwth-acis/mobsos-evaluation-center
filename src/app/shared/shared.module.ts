import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {
  MatNativeDateModule,
  MatRippleModule,
} from '@angular/material/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfirmationDialogComponent } from './dialogs/confirmation-dialog/confirmation-dialog.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { SqlTableComponent } from './sql-table/sql-table.component';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AddCommunityDialogComponent } from './dialogs/add-community-dialog/add-community-dialog.component';
import { UnavailableServicesDialogComponent } from './dialogs/unavailable-services-dialog/unavailable-services-dialog.component';
import { MatListModule } from '@angular/material/list';
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
