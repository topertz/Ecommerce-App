import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';

export interface User {
    id: number;
    username: string;
    role: string;
}

export interface LoginResponse {
    message: string;
    token: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:3000/api';
    private readonly tokenKey = 'token'; 

    register(username: string, password: string): Observable<{ message: string }> {
            return this.http.post<{ message: string }>(`${this.apiUrl}/register`, {
                username,
                password
            }
        );
    }

    login(username: string, password: string): Observable<LoginResponse> {
            return this.http.post<LoginResponse>(`${this.apiUrl}/login`, {
                    username,
                password
                }
            )
            .pipe(tap(response => {
                localStorage.setItem(this.tokenKey, response.token);  
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    getCurrentUser(): Observable<User> {
        return this.http.get<User>(`${this.apiUrl}/me`);
    }

    isAdmin(): Observable<boolean> {
        return this.getCurrentUser().pipe(map(user => user.role === 'admin'));
    }
}