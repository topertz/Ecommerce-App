import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  errorMessage = '';
  loading = false;


  login(): void {
    this.errorMessage = '';

    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Username and password are required';
      return;
    }

    this.loading = true;

    this.authService.login(this.username.trim(), this.password
    )
    .subscribe({

        next: () => {
          this.loading = false;

          this.authService.getCurrentUser().subscribe({
            next: (user) => {
              if (user.role === 'admin') {
                this.router.navigate(['/admin']);
              } else {
                this.router.navigate(['/']);
              }
          },

          error: () => {
            this.router.navigate(['/']);
          }

        });

      },

        error: (error) => {

          console.error('LOGIN ERROR:', error);

          this.errorMessage =
            error.error?.message ||
            'Login failed';

          this.loading = false;

        }
      });
  }
}