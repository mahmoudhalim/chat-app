import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthAPI } from '../services/auth-api';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authAPI = inject(AuthAPI);

  errorMessage = signal<string | null>(null);

  registerForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.registerForm.valid) {
      this.errorMessage.set(null);
      const data = this.registerForm.getRawValue();

      this.authAPI.register(data).subscribe({
        next: () => {
          this.authAPI.login(data.username, data.password).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: (err: any) => {
              console.error('Login after registration failed', err);
              this.router.navigate(['/login']);
            }
          });
        },
        error: (err: any) => {
          console.error('Registration failed', err);
          if (err.status === 409) {
               this.errorMessage.set('Username or Email is already taken.');
          } else {
             this.errorMessage.set('An error occurred during registration.');
          }
        }
      });
    }
  }
}
