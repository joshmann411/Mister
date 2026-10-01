import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

type SortBy = 'title' | 'category' | 'brand' | 'price' | 'rating' | 'stock';
type SortOrder = 'asc' | 'desc';

interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  image: string;
}

interface ProductResponse {
  items: Product[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  sort: {
    sortBy: SortBy;
    sortOrder: SortOrder;
  };
  search: string;
}

interface ProductSuggestion {
  id: number;
  title: string;
  category: string;
  brand: string;
  image: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly http = inject(HttpClient);
  private suggestionTimeout?: ReturnType<typeof setTimeout>;
  protected readonly apiBaseUrl = 'http://localhost:3000';

  protected readonly products = signal<Product[]>([]);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(12);
  protected readonly totalItems = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly search = signal('');
  protected readonly sortBy = signal<SortBy>('title');
  protected readonly sortOrder = signal<SortOrder>('asc');
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly suggestions = signal<ProductSuggestion[]>([]);
  protected readonly showSuggestions = signal(false);

  protected readonly resultSummary = computed(() => {
    const totalItems = this.totalItems();

    if (totalItems === 0) {
      return 'No products found';
    }

    const first = (this.page() - 1) * this.pageSize() + 1;
    const last = Math.min(this.page() * this.pageSize(), totalItems);

    return `${first}-${last} of ${totalItems} products`;
  });

  constructor() {
    this.loadProducts();
  }

  protected imageUrl(product: Product): string {
    return `${this.apiBaseUrl}${product.image}`;
  }

  protected applyFilters(): void {
    this.clearSuggestionTimer();
    this.showSuggestions.set(false);
    this.page.set(1);
    this.loadProducts();
  }

  protected updateSearch(value: string): void {
    this.search.set(value);
    this.clearSuggestionTimer();

    if (value.trim() === '') {
      this.suggestions.set([]);
      this.showSuggestions.set(false);
      this.applyFilters();
      return;
    }

    if (value.trim().length < 3) {
      this.suggestions.set([]);
      this.showSuggestions.set(false);
      return;
    }

    this.suggestionTimeout = setTimeout(() => this.loadSuggestions(value), 300);
  }

  protected selectSuggestion(suggestion: ProductSuggestion): void {
    this.search.set(suggestion.title);
    this.suggestions.set([]);
    this.showSuggestions.set(false);
    this.applyFilters();
  }

  protected previousPage(): void {
    if (this.page() === 1) {
      return;
    }

    this.page.update((page) => page - 1);
    this.loadProducts();
  }

  protected nextPage(): void {
    if (this.page() === this.totalPages()) {
      return;
    }

    this.page.update((page) => page + 1);
    this.loadProducts();
  }

  private loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const params = new HttpParams()
      .set('page', this.page())
      .set('pageSize', this.pageSize())
      .set('search', this.search().trim())
      .set('sortBy', this.sortBy())
      .set('sortOrder', this.sortOrder());

    this.http.get<ProductResponse>(`${this.apiBaseUrl}/api/products`, { params }).subscribe({
      next: (response) => {
        this.products.set(response.items);
        this.totalItems.set(response.pagination.totalItems);
        this.totalPages.set(response.pagination.totalPages);
        this.isLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.totalItems.set(0);
        this.totalPages.set(1);
        this.errorMessage.set('Could not load products. Start the backend and try again.');
        this.isLoading.set(false);
      },
    });
  }

  private loadSuggestions(value: string): void {
    const search = value.trim();

    if (search.length < 3 || search !== this.search().trim()) {
      return;
    }

    const params = new HttpParams().set('search', search);

    this.http
      .get<{ items: ProductSuggestion[] }>(`${this.apiBaseUrl}/api/products/suggestions`, { params })
      .subscribe({
        next: (response) => {
          if (search !== this.search().trim()) {
            return;
          }

          this.suggestions.set(response.items);
          this.showSuggestions.set(response.items.length > 0);
        },
        error: () => {
          this.suggestions.set([]);
          this.showSuggestions.set(false);
        },
      });
  }

  private clearSuggestionTimer(): void {
    if (this.suggestionTimeout) {
      clearTimeout(this.suggestionTimeout);
      this.suggestionTimeout = undefined;
    }
  }
}
