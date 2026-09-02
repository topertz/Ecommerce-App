import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
selector: 'app-register',
imports: [RouterLink, FormsModule],
templateUrl: './register.html',
styleUrl: './register.css'
})
export class Register {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  username = '';
  password = '';
  confirmPassword = '';

  errorMessage = '';
  loading = false;

  register(): void {
    this.errorMessage = '';

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.loading = true;

    this.authService
      .register(
        this.username.trim(),
        this.password
      )
      .subscribe({

        next: () => {

          this.loading = false;

          this.router.navigate(['/login']);

        },

        error: (error) => {

          console.error('REGISTER ERROR:', error);

          this.errorMessage =
            error.error?.message ||
            'Registration failed';

          this.loading = false;

        }

      });

    }

}