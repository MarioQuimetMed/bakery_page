import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Producto {
  id?: number;
  nombre: string;
  descripcion?: string;
  url_image?: string;
  created_at?: string;
  updated_at?: string;
}

export type CrearProductoPayload = FormData;

export type ActualizarProductoPayload = Partial<Pick<Producto, 'nombre' | 'descripcion' | 'url_image'>>;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/productos`;
  private readonly http = inject(HttpClient);

  // LISTAR PRODUCTOS
  listarProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  // OBTENER PRODUCTO POR ID
  obtenerProductoPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  // CREAR PRODUCTO
  crearProducto(formData: CrearProductoPayload): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, formData);
  }

  // EDITAR PRODUCTO
  actualizarProducto(id: number, producto: ActualizarProductoPayload): Observable<Producto> {
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, producto);
  }

  // ELIMINAR PRODUCTO
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Alias compatibles con el nombre anterior
  updateProduct(id: number, producto: ActualizarProductoPayload): Observable<Producto> {
    return this.actualizarProducto(id, producto);
  }

  deleteProducto(id: number): Observable<void> {
    return this.deleteProduct(id);
  }
}