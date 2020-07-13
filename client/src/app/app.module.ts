import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LinkEditComponent } from './components/link-edit-form/link-edit-form.component';
import { RedirectComponent } from './components/redirect/redirect.component';
import { LinkService } from './services/link.service';
import { HttpClientModule } from '@angular/common/http';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NavBarComponent } from './components/nav-bar/nav-bar.component';
import { GaTokenService } from './services/ga.token.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
@NgModule({
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    RouterModule.forRoot([
      { path: '', component: LinkEditComponent },
      { path: 'dashboard', component: DashboardComponent },
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
    DashboardComponent,
    NavBarComponent,
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
