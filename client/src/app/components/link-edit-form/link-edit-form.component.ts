import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { LinkService } from 'client/src/app/services/link.service';
import { environment as env } from 'client/src/environments/environment';
import { BehaviorSubject, Subject } from 'rxjs';
import { auditTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Link } from 'server/src/interfaces/linkResponse';

export enum State {
  INIT,
  PENDING,
  SUCCESS,
  ERROR,
}

@Component({
  selector: 'link-edit-form',
  templateUrl: './link-edit-form.component.html',
  styleUrls: ['./link-edit-form.component.css'],
})
export class LinkEditComponent implements OnInit, OnDestroy {
  linkEditForm: FormGroup;
  state = State;
  linkCreationState$ = new BehaviorSubject<State>(State.INIT);
  linkLoadingState$ = new BehaviorSubject<State>(State.INIT);
  originalUrlInDb = '';
  environment = env;
  shortUrlValue$ = new Subject<string>();

  destroyed = new Subject<void>();

  constructor(
    private linkService: LinkService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.linkEditForm = this.formBuilder.group({
      shortUrl: new FormControl('', [
        Validators.required,
        Validators.pattern('(\\w|-)+'), // Only allow alphanumeric and dash in short url.
      ]),
      originalUrl: new FormControl('', [
        Validators.required,
        Validators.pattern('.+\\..+'),
      ]),
    });
  }

  @HostListener('document:keyup', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.ctrlKey && event.code === 'Enter') {
      // ctrl + enter. Submit the form
      this.onSubmit(this.linkEditForm);
      return;
    }
  }

  ngOnDestroy() {
    this.destroyed.next();
  }

  ngOnInit() {
    this.shortUrlValue$
      .pipe(
        takeUntil(this.destroyed),
        auditTime(200 /* 200ms*/),
        filter((value) => {
          return !this.shortUrlInvalid;
        }),
        tap((v) => this.linkLoadingState$.next(State.PENDING)),
        switchMap((shortUrl) => {
          return this.linkService.getLink(shortUrl);
        })
      )
      .subscribe(
        (res: Link) => {
          this.linkLoadingState$.next(State.SUCCESS);
          if (res) {
            this.linkEditForm.patchValue({ originalUrl: res.originalLink });
            this.originalUrlInDb = res.originalLink;
          } else {
            this.originalUrlInDb = '';
          }
        },
        (err) => {
          this.linkLoadingState$.next(State.ERROR);
          this.snackBar.open(`Error: ${JSON.stringify(err)}`, 'dismiss', {
            duration: 4000,
          });
        }
      );

    // Url redirect  /xxxx
    this.route.paramMap.subscribe((params) => {
      const link = params.get('link');
      if (link) {
        this.linkEditForm.patchValue({ shortUrl: link });
        this.onShortUrlUpdate(link);
      }
    });
  }

  get shortUrl() {
    return this.linkEditForm.get('shortUrl');
  }

  get shortUrlInvalid(): boolean {
    return (
      this.shortUrl.errors &&
      (this.shortUrl.errors.pattern || this.shortUrl.errors.required) &&
      (this.shortUrl.dirty || this.shortUrl.touched)
    );
  }

  get originalUrlInvalid(): boolean {
    return (
      this.originalUrl.invalid &&
      (this.originalUrl.dirty || this.originalUrl.touched)
    );
  }

  get originalUrl(): AbstractControl {
    return this.linkEditForm.get('originalUrl');
  }

  submitButtonUiString(): string {
    return this.originalUrlInDb ? 'Modify' : 'Create';
  }

  onShortUrlUpdate(value: string) {
    // to lowercase
    value = value.toLowerCase();
    this.shortUrl.setValue(value);

    this.shortUrlValue$.next(value);
    this.linkCreationState$.next(State.INIT);
  }

  onOriginalUrlUpdate(value: string) {
    this.linkCreationState$.next(State.INIT);
  }

  /**
   * For extensibility, we create a temp textarea element.
   */
  copyToClipboard(value: string) {
    const textarea = document.createElement('textarea');
    textarea.style.height = '0px';
    textarea.style.left = '-100px';
    textarea.style.opacity = '0';
    textarea.style.position = 'fixed';
    textarea.style.top = '-100px';
    textarea.style.width = '0px';
    document.body.appendChild(textarea);
    // Set and select the value (creating an active Selection range).
    textarea.value = value;
    textarea.select();
    // Ask the browser to copy the current selection to the clipboard.
    const successful = document.execCommand('copy');
    if (successful) {
      // show banner
    } else {
      // handle the error
    }
    if (textarea && textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }
  }

  onSubmit(linkEditForm) {
    const link: Link = {
      shortLink: linkEditForm.shortUrl,
      originalLink: linkEditForm.originalUrl,
    };
    this.linkCreationState$.next(State.PENDING);
    this.linkService
      .addLink(link)
      .pipe(takeUntil(this.destroyed))
      .subscribe(
        (response) => {
          this.linkCreationState$.next(State.SUCCESS);
          this.linkEditForm.markAsUntouched();
          this.linkEditForm.markAsPristine();
          const completedShortUrl =
            env.serverAddress + '/' + linkEditForm.shortUrl;
          this.copyToClipboard(completedShortUrl);
          this.snackBar.open(
            `${completedShortUrl} was created and copied to your clipboard`,
            'dismiss',
            {
              duration: 4000,
            }
          );
        },
        (error) => {
          this.linkCreationState$.next(State.ERROR);
          this.snackBar.open(`Error: ${JSON.stringify(error)}`, 'dismiss', {
            duration: 4000,
          });
        }
      );
  }

  isSubmittable(): boolean {
    return (
      !this.shortUrlInvalid &&
      !this.originalUrlInvalid &&
      this.originalUrl.value &&
      this.shortUrl.value
    );
  }
}

/*
Copyright Google LLC. All Rights Reserved.
Use of this source code is governed by an MIT-style license that
can be found in the LICENSE file at http://angular.io/license
*/
