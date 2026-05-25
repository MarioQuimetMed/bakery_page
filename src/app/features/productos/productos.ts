import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, OnInit, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ProductService, Producto } from '../../core/services/product.services';

@Component({
  selector: 'app-productos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './productos.html',
  styleUrl: './productos.css',
})
export class Productos implements OnInit, AfterViewInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('productDialog') productDialog!: ElementRef<HTMLDialogElement>;
  @ViewChild('productForm') productForm!: ElementRef<HTMLFormElement>;
  @ViewChild('dvdVideo') dvdVideo!: ElementRef<HTMLVideoElement>;

  protected readonly products = signal<Producto[]>([]);
  protected readonly searchTerm = signal('');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly editingProduct = signal<Producto | null>(null);

  private animationFrameId?: number;

  protected readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    if (!term) {
      return this.products();
    }

    return this.products().filter((product) => {
      const nombre = product.nombre.toLowerCase();
      const descripcion = (product.descripcion ?? '').toLowerCase();
      return nombre.includes(term) || descripcion.includes(term);
    });
  });

  protected readonly totalProducts = computed(() => this.products().length);
  protected readonly visibleProducts = computed(() => this.filteredProducts().length);

  ngOnInit(): void {
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    const video = this.dvdVideo?.nativeElement;
    if (video) {
      // Force muted play loop
      video.muted = true;
      video.volume = 0;
      video.playsInline = true;
      video.loop = true;

      const playVideo = () => {
        video.muted = true;
        video.volume = 0;
        video.play().catch((err) => console.log('Autoplay blocked, waiting for user click', err));
      };

      if (video.readyState >= 1) {
        playVideo();
      } else {
        video.addEventListener('loadedmetadata', playVideo);
      }

      // Interaction fallback
      const playOnInteraction = () => {
        video.muted = true;
        video.volume = 0;
        video.play().then(() => {
          document.removeEventListener('click', playOnInteraction);
        });
      };
      document.addEventListener('click', playOnInteraction);

      // Start the bounce animation loop
      this.startBouncing();
    }
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private startBouncing(): void {
    const video = this.dvdVideo?.nativeElement;
    if (!video) return;

    const speed = 2; // Pixels per frame
    
    // Random direction vectors
    let dx = Math.random() < 0.5 ? -speed : speed;
    let dy = Math.random() < 0.5 ? -speed : speed;

    const width = 180;
    
    // Random starting positions within viewport bounds
    let x = Math.random() * (window.innerWidth - width);
    let y = Math.random() * (window.innerHeight - width); // assume approx square height if not loaded yet

    // Ensure they start inside bounds
    x = Math.max(0, Math.min(x, window.innerWidth - width));
    y = Math.max(0, Math.min(y, window.innerHeight - width));

    const update = () => {
      const videoEl = this.dvdVideo?.nativeElement;
      if (!videoEl) return;

      const currentWidth = 180;
      const currentHeight = videoEl.clientHeight || 180;

      x += dx;
      y += dy;

      // Bounce left/right
      if (x <= 0) {
        x = 0;
        dx = -dx;
      } else if (x + currentWidth >= window.innerWidth) {
        x = window.innerWidth - currentWidth;
        dx = -dx;
      }

      // Bounce top/bottom
      if (y <= 0) {
        y = 0;
        dy = -dy;
      } else if (y + currentHeight >= window.innerHeight) {
        y = window.innerHeight - currentHeight;
        dy = -dy;
      }

      videoEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  protected onSearch(value: string): void {
    this.searchTerm.set(value);
  }

  protected onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.onSearch(input?.value ?? '');
  }

  protected reload(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.productService
      .listarProductos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (products) => {
          this.products.set(products);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('No fue posible cargar los productos. Intenta nuevamente.');
          this.loading.set(false);
        },
      });
  }

  protected openDialog(product?: Producto): void {
    if (product) {
      this.editingProduct.set(product);
    } else {
      this.editingProduct.set(null);
    }
    this.productDialog.nativeElement.showModal();
  }

  protected closeDialog(): void {
    this.productDialog.nativeElement.close();
    this.productForm.nativeElement.reset();
    this.editingProduct.set(null);
  }

  protected saveProduct(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const editing = this.editingProduct();
    this.loading.set(true);
  
    if (editing && editing.id) {
      // Update
      const payload = {
        nombre: formData.get('nombre') as string,
        descripcion: formData.get('descripcion') as string,
      };
      this.productService.actualizarProducto(editing.id, payload).subscribe({
        next: () => {
          this.closeDialog();
          this.loadProducts();
        },
        error: () => {
          this.error.set('No se pudo actualizar el producto.');
          this.loading.set(false);
        }
      });
    } else {
      // Create
      this.productService.crearProducto(formData).subscribe({
        next: () => {
          this.closeDialog();
          this.loadProducts();
        },
        error: () => {
          this.error.set('No se pudo crear el producto.');
          this.loading.set(false);
        }
      });
    }
  }

  protected deleteProduct(id: number | undefined): void {
    if (!id) return;
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      this.loading.set(true);
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
        },
        error: () => {
          this.error.set('No se pudo eliminar el producto.');
          this.loading.set(false);
        }
      });
    }
  }

  protected fallbackImage(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23f3e8d6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238b5e34" font-family="Arial, sans-serif" font-size="28">Pastelería Bakery Page</text></svg>';
  }
}
