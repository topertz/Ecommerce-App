import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
}

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private http = inject(HttpClient);
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


    this.http
      .post<LoginResponse>(
        'http://localhost:3000/api/login',
        {
          username: this.username.trim(),
          password: this.password
        }
      )
      .subscribe({

        next: (response) => {

          localStorage.setItem(
            'adminUser',
            JSON.stringify(response.user)
          );

          localStorage.setItem(
            'token',
            response.token
          );

          this.loading = false;

          if (response.user.role === 'admin') {
            this.router.navigate(['/admin']);
          } else {
            this.router.navigate(['/']);
          }
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