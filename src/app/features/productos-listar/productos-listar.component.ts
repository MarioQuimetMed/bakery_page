import { Component, OnInit } from '@angular/core';
import { ProductService, Producto } from '../../core/services/product.services';

@Component({
  selector: 'app-productos-listar',
  templateUrl: './productos-listar.component.html',
  styleUrls: ['./productos-listar.component.css']
})
export class ProductosListarComponent implements OnInit {

  productos: Producto[] = [];
  cargando = false;
  error = '';

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.obtenerProductos();
  }

  obtenerProductos(): void {
    this.cargando = true;
    this.productService.listarProductos().subscribe({
      next: (data) => {
        this.productos = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudieron cargar los productos.';
        this.cargando = false;
      }
    });
  }
}