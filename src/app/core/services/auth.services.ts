import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Cambia esta URL por la dirección de tu backend NestJS
  private apiUrl = 'http://localhost:3000/api/auth'; 

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        // Si el backend devuelve un token, lo guardamos para proteger las rutas
        if (response && response.token) {
          localStorage.setItem('bakery_token', response.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('bakery_token');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('bakery_token');
  }
}