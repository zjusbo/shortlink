import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GaTokenService } from 'client/src/app/services/ga.token.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export enum State {
  INIT,
  PENDING,
  SUCCESS,
  ERROR,
}
/**
 * suppress gapi not found warning
 */
declare var gapi: any;

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  accessToken = '';
  destroyed = new Subject<void>();
  isLoading = true;

  constructor(
    private gaTokenService: GaTokenService,
    private renderer2: Renderer2,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    @Inject(DOCUMENT) private document
  ) {}

  ngOnInit() {
    this.gaTokenService
      .getAccessToken()
      .pipe(takeUntil(this.destroyed))
      .subscribe(
        (accessToken) => {
          this.accessToken = accessToken;
          this.renderGaChart();
        },
        (err) => {
          this.snackBar.open(`Error: ${JSON.stringify(err)}`);
          this.isLoading = false;
        }
      );
  }

  ngOnDestroy() {
    this.destroyed.next();
  }

  /**
   * render the Ga chart
   */
  renderGaChart() {
    // set correct self context for the callback function
    const self = this;
    /**
     * For gapi.analytics usage, please check
     * https://ga-dev-tools.appspot.com/embed-api/basic-dashboard/
     */
    gapi.analytics.ready(() => {
      /**
       * Authorize the user with an access token obtained server side.
       */
      gapi.analytics.auth.authorize({
        serverAuth: {
          access_token: self.accessToken,
        },
      });

      /**
       * Creates a new DataChart instance showing sessions over the past 30 days.
       * It will be rendered inside an element with the id "chart-1-container".
       */
      const lineChart = new gapi.analytics.googleCharts.DataChart({
        query: {
          ids: 'ga:219067273', // <-- Replace with the ids value for your view.
          'start-date': '30daysAgo',
          'end-date': 'yesterday',
          metrics: 'ga:sessions,ga:users',
          dimensions: 'ga:date',
        },
        chart: {
          container: 'line-chart-container',
          type: 'LINE',
          options: {
            width: '100%',
          },
        },
      });
      lineChart.execute();

      /**
       * Creates a new DataChart instance showing top 5 most popular demos/tools
       * amongst returning users only.
       * It will be rendered inside an element with the id "chart-3-container".
       */
      const pieChart = new gapi.analytics.googleCharts.DataChart({
        query: {
          ids: 'ga:219067273', // <-- Replace with the ids value for your view.
          'start-date': '30daysAgo',
          'end-date': 'yesterday',
          metrics: 'ga:pageviews',
          dimensions: 'ga:pagePathLevel1',
          sort: '-ga:pageviews',
          filters: 'ga:pagePathLevel1!=/',
          'max-results': 7,
        },
        chart: {
          container: 'pie-chart-container',
          type: 'PIE',
          options: {
            width: '100%',
            pieHole: 4 / 9,
          },
        },
      });
      pieChart.execute();

      /**
       * Create a table chart showing top browsers for users to interact with.
       * Clicking on a row in the table will update a second timeline chart with
       * data from the selected browser.
       */
      const tableChart = new gapi.analytics.googleCharts.DataChart({
        query: {
          ids: 'ga:219067273', // <-- Replace with the ids value for your view.
          dimensions: 'ga:pagePathLevel1',
          metrics: 'ga:sessions,ga:pageviews,ga:users',
          sort: '-ga:sessions',
          filters: `ga:pagePathLevel1!=/`,
          'max-results': '30',
        },
        chart: {
          type: 'TABLE',
          container: 'table-chart-container',
          options: {
            width: '100%',
          },
        },
      });

      tableChart.execute();
      self.isLoading = false;
      self.cd.detectChanges();
    });
  }
}

/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/
