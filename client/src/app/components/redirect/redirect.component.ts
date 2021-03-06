import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkService } from 'client/src/app/services/link.service';
import { DEFAULT_PROTOCOL } from '../../shared/consts';
import { isContainProtocol } from '../../shared/utils';

@Component({
  selector: 'app-redirect-component',
  templateUrl: 'redirect.component.html',
  styleUrls: ['redirect.component.css'],
})
export class RedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private linkService: LinkService
  ) {}

  originalUrl = '...';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const shortLink = params.get('link').toLocaleLowerCase();
      this.linkService.getLink(shortLink).subscribe((link) => {
        if (link == null) {
          // short_link does not exist in DB
          // navigate to the link edit page
          this.router.navigate(['/edit', shortLink]);
        } else {
          // redirect to the original_link
          const protoPattern = /^\w{1,5}:\/\//g;
          let originalLink = link.originalLink;
          if (!isContainProtocol(originalLink)) {
            // add default protocol
            originalLink = DEFAULT_PROTOCOL + originalLink;
          }
          this.originalUrl = originalLink;
          window.location.href = originalLink;
        }
      });
    });
  }
}
