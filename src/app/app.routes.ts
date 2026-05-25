import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  {
    path: 'productos',
    loadComponent: () => import('./features/productos/productos').then((m) => m.Productos),
  },
  { path: '**', redirectTo: 'productos' }
];