// src/app/modules/auth/components/registration/registration.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfirmPasswordValidator } from './confirm-password.validator';
import { UserModel } from '../../models/user.model';
import { first } from 'rxjs/operators';
import { AuthGoogleService } from '../../../../auth-google.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
  registrationForm: FormGroup;
  hasError: boolean = false;
  registrationSuccess: boolean = false;
  isLoading$: Observable<boolean>;
  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private authGoogleService: AuthGoogleService
  ) {
    this.isLoading$ = this.authService.isLoading$;
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  /** Método para iniciar sesión con Google */
  login() {
    this.authGoogleService.login();
  }

  /** Si solo lo usas para debug, cámbialo a getIdentityClaims() */
  showData() {
    const data = JSON.stringify(this.authGoogleService.getIdentityClaims());
    console.log(data);
  }

  logOut() {
    this.authGoogleService.logout();
    this.router.navigate(['login']);
  }

  ngOnInit(): void {
    this.initForm();
  }

  get f() {
    return this.registrationForm.controls;
  }

  initForm() {
    this.registrationForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        email: ['', [Validators.required, Validators.email, Validators.minLength(3), Validators.maxLength(320)]],
        password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        cPassword: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        agree: [false, Validators.required],
      },
      {
        validator: ConfirmPasswordValidator.MatchPassword,
      }
    );
  }

  submit() {
    this.hasError = false;
    this.registrationSuccess = false;

    const result: { [key: string]: string } = {};
    Object.keys(this.f).forEach((key) => {
      result[key] = this.f[key].value;
    });

    const newUser = new UserModel();
    newUser.setUser({
      name: result.name,
      email: result.email,
      password: result.password,
    });

    const registrationSubscr = this.authService
      .registration(newUser)
      .pipe(first())
      .subscribe((user: UserModel) => {
        if (user) {
          this.registrationSuccess = true;
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 2000);
        } else {
          this.hasError = true;
        }
      });

    this.unsubscribe.push(registrationSubscr);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
