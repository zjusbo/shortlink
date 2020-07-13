import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'client/src/environments/environment';
import { Observable } from 'rxjs';
const GA_TOKEN_API_PATH = '/api/ga-token';

@Injectable({
  providedIn: 'root',
})
export class GaTokenService {
  constructor(private http: HttpClient) {}
  getAccessToken(): Observable<string> {
    return this.http.get(
      environment.serverAddress + GA_TOKEN_API_PATH
    ) as Observable<string>;
  }
}
