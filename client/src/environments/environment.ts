// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  serverAddress: 'http://localhost:3000',
  hostname: 'localhost:3000',
  // Replace with your reCAPTCHA v3 site key from https://www.google.com/recaptcha/admin/create
  // Leave as empty string to disable reCAPTCHA in development
  recaptchaSiteKey: '6LdXDY0sAAAAAKJ7U49EPtnCD3HkzB2w15l2ISu9',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
