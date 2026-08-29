import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
selector: 'app-register',
imports: [RouterLink, FormsModule],
templateUrl: './register.html',
styleUrl: './register.css'
})
export class Register {

private http = inject(HttpClient);
private router = inject(Router);

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

this.http
  .post('http://localhost:3000/api/register', {
    username: this.username,
    password: this.password
  })
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