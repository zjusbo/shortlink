import { Component, OnInit } from '@angular/core';
import { LinkService } from 'client/src/app/services/link.service';
import { tap } from 'rxjs/operators';
import { Links } from 'server/src/interfaces/link';
import { State } from '../dashboard/dashboard.component';

@Component({
  selector: 'link-overview',
  templateUrl: './link-overview.component.html',
  styleUrls: ['./link-overview.css'],
})
export class LinkOverviewComponent implements OnInit {
  constructor(private linkService: LinkService) {}
  state = State;
  links = [{ shortLink: 'short', originalLink: 'original' }];
  status: State = State.INIT;
  ngOnInit() {
    this.linkService
      .getAllLinks()
      .pipe(tap((v) => (this.status = State.PENDING)))
      .subscribe((links: Links) => {
        this.links = links;
        this.status = State.SUCCESS;
      });
  }
}
