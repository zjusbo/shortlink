import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkService } from 'client/src/app/services/link.service';

// Default protocol is added as prefix to the original_link if no protocol is presented in the link
const DEFAULT_PROTOCOL = 'http://';

@Component({
  selector: 'app-redirect-component',
  template: '',
  styles: [],
})
export class RedirectComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private linkService: LinkService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const shortLink = params.get('link');
      this.linkService.getLink(shortLink).subscribe((link) => {
        if (link == null) {
          // short_link does not exist in DB
          // navigate to the link edit page
          this.router.navigate(['/edit', shortLink]);
        } else {
          // redirect to the original_link
          const protoPattern = /^\w{1,5}:\/\//g;
          let originalLink = link.originalLink;
          if (!protoPattern.test(originalLink)) {
            // add default protocol
            originalLink = DEFAULT_PROTOCOL + originalLink;
          }
          window.location.href = originalLink;
        }
      });
    });
  }
}
