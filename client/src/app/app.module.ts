import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LinkEditComponent } from './components/link-edit-form/link-edit-form.component';
import { LinkOverviewComponent } from './components/link-overview/link-overview.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { GaTokenService } from './services/ga.token.service';
import { LinkService } from './services/link.service';
import { HrefUrlPipe } from './shared/href-url.pipe';

@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    RouterModule.forRoot([
      { path: '', component: LinkEditComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'links', component: LinkOverviewComponent },
      { path: 'edit/:link', component: LinkEditComponent },
      { path: ':link', component: RedirectComponent },
      // Redirect to link edit component if the link does not exist
      { path: '*', component: LinkEditComponent },
    ]),
    BrowserAnimationsModule,
  ],
  declarations: [
    AppComponent,
    LinkEditComponent,
    HrefUrlPipe,
    LinkOverviewComponent,
    DashboardComponent,
    NavBarComponent,
    RedirectComponent,
  ],
  bootstrap: [AppComponent],
  providers: [LinkService, GaTokenService],
})
export class AppModule {}

/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/
