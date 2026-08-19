import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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
    this.loading = true;


    this.http
      .post<any>(
        'http://localhost:3000/api/login',
        {
          username: this.username,
          password: this.password
        }
      )
      .subscribe({

        next: (response) => {

          localStorage.setItem(
            'adminUser',
            JSON.stringify(response.user)
          );

          this.loading = false;

          this.router.navigate(['/admin']);

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