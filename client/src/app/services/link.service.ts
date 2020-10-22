import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'client/src/environments/environment';
import { Observable, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Link, Links, parseLinks } from 'server/src/interfaces/link';
import { LinkResponse } from 'server/src/interfaces/linkResponse';

const LINK_API_PATH = '/api/link';

@Injectable({
  providedIn: 'root',
})
export class LinkService {
  constructor(private http: HttpClient) {}
  getAllLinks(): Observable<Links> {
    return this.http.get(environment.serverAddress + LINK_API_PATH).pipe(
      map((res) => {
        return parseLinks(JSON.stringify(res));
      })
    );
  }

  getLink(shortLink: string): Observable<Link> {
    return this.http
      .get(environment.serverAddress + LINK_API_PATH + `/${shortLink}`)
      .pipe(
        map((res) => {
          const response: LinkResponse = LinkResponse.fromJson(
            JSON.stringify(res)
          );
          if (!response.isOK()) {
            throwError(response.getMsg());
          }
          return response.getData();
        })
      );
  }

  addLink(link: Link): Observable<Link> {
    const headers = new HttpHeaders();
    headers.append('Content-Type', 'application/json');
    return this.http
      .post(environment.serverAddress + LINK_API_PATH, link, {
        headers,
      })
      .pipe(
        map((res) => {
          const response: LinkResponse = LinkResponse.fromJson(
            JSON.stringify(res)
          );
          if (!response.isOK()) {
            throwError(response.getMsg());
          } else {
            return response.getData();
          }
        })
      );
  }
}
