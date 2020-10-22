/**
 * Indicates the status of all async tasks.
 */
export enum State {
  INIT,
  PENDING,
  SUCCESS,
  ERROR,
}


// Default protocol is added as prefix to the original_link if no protocol is presented in the link
export const DEFAULT_PROTOCOL = 'http://';
