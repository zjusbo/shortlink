import { Pipe, PipeTransform } from '@angular/core';
import { DEFAULT_PROTOCOL } from './consts';
import { isContainProtocol } from './utils';

/** 
 * adds DEFAULT_PROTOCOL to the input string to become a href compatible url.
 */
@Pipe({name: 'hrefUrl'})
export class HrefUrlPipe implements PipeTransform {
  transform(value: string): string {
      return isContainProtocol(value) ? value : DEFAULT_PROTOCOL + value;
  }
}
