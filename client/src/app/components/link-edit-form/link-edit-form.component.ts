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
import { State } from 'client/src/app/shared/consts';
import { environment as env } from 'client/src/environments/environment';
import * as QRCode from 'qrcode';
import { BehaviorSubject, Subject } from 'rxjs';
import { auditTime, filter, switchMap, takeUntil, tap } from 'rxjs/operators';
import { Link } from 'server/src/interfaces/link';

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
  qrCodeDataUrl = '';
  lastCreatedShortUrl = '';

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
    // Dynamically load reCAPTCHA v3 script if a site key is configured
    if (env.recaptchaSiteKey && !document.querySelector('script[src*="recaptcha/api.js"]')) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${env.recaptchaSiteKey}`;
      script.async = true;
      document.head.appendChild(script);
    }

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
    this.qrCodeDataUrl = '';
  }

  onOriginalUrlUpdate(value: string) {
    this.linkCreationState$.next(State.INIT);
    this.qrCodeDataUrl = '';
  }

  /** Copy text to clipboard — uses modern Clipboard API with execCommand fallback. */
  async copyToClipboard(value: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
        return;
      }
    } catch (_) {
      // Fall through to execCommand fallback
    }
    // Fallback: works on older browsers and iOS Safari without HTTPS
    const textarea = document.createElement('textarea');
    textarea.style.cssText = 'position:fixed;top:-100px;left:-100px;width:0;height:0;opacity:0;';
    document.body.appendChild(textarea);
    textarea.value = value;
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }

  downloadQrCode() {
    const link = document.createElement('a');
    link.download = `qr-${this.lastCreatedShortUrl}.png`;
    link.href = this.qrCodeDataUrl;
    link.click();
  }

  onSubmit(linkEditForm) {
    const grecaptcha = (window as any).grecaptcha;
    if (env.recaptchaSiteKey && grecaptcha) {
      // reCAPTCHA v3 is configured — execute it before submitting
      grecaptcha.ready(() => {
        grecaptcha
          .execute(env.recaptchaSiteKey, { action: 'submit_link' })
          .then((token: string) => {
            this._doSubmit(linkEditForm, token);
          })
          .catch(() => {
            this.linkCreationState$.next(State.ERROR);
            this.snackBar.open(
              'reCAPTCHA error. Please refresh and try again.',
              'dismiss',
              { duration: 4000 }
            );
          });
      });
    } else {
      // No reCAPTCHA configured (development) — submit without token
      this._doSubmit(linkEditForm, '');
    }
  }

  private _doSubmit(linkEditForm, recaptchaToken: string) {
    const link: Link = {
      shortLink: linkEditForm.shortUrl,
      originalLink: linkEditForm.originalUrl,
    };
    this.linkCreationState$.next(State.PENDING);
    this.linkService
      .addLink(link, recaptchaToken)
      .pipe(takeUntil(this.destroyed))
      .subscribe(
        (response) => {
          this.linkCreationState$.next(State.SUCCESS);
          this.linkEditForm.markAsUntouched();
          this.linkEditForm.markAsPristine();

          const completedShortUrl = env.serverAddress + '/' + linkEditForm.shortUrl;
          this.lastCreatedShortUrl = linkEditForm.shortUrl;

          this.copyToClipboard(completedShortUrl);
          this.snackBar.open(
            `${completedShortUrl} copied to clipboard`,
            'dismiss',
            { duration: 4000 }
          );

          // Generate QR code for the created short link
          QRCode.toDataURL(completedShortUrl, { width: 280, margin: 2 })
            .then((dataUrl) => { this.qrCodeDataUrl = dataUrl; })
            .catch((err) => console.error('QR generation failed', err));
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
