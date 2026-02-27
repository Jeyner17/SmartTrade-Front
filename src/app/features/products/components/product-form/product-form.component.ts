import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup,
  Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../../categories/services/category.service';
import { AlertService } from '../../../../core/services/alert.service';
import { CategoryFlat } from '../../../categories/models/category.model';
import { Product } from '../../models/product.model';

/**
 * Componente de Formulario de Producto (Crear / Editar)
 * Sprint 6 - Gestión de Productos
 *
 * 4 secciones: Básica | Códigos | Precios | Imagen
 */
@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.component.html',
  styleUrl: './product-form.component.css'
})
export class ProductFormComponent implements OnInit, OnDestroy {

  form!: FormGroup;
  isEditMode = false;
  productId: number | null = null;
  currentProduct: Product | null = null;

  isLoading  = false;
  isSaving   = false;

  // Categorías para el selector
  categories: CategoryFlat[] = [];

  // Imagen
  selectedFile:      File | null = null;
  imagePreviewUrl:   string | null = null;
  existingImageUrl:  string | null = null;
  isUploadingImage = false;

  // Validación de barcode
  barcodeCheckSubject = new Subject<string>();
  barcodeError: string | null = null;
  barcodeChecking = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb:              FormBuilder,
    private route:           ActivatedRoute,
    private router:          Router,
    private productService:  ProductService,
    private categoryService: CategoryService,
    private alertService:    AlertService
  ) {}

  ngOnInit(): void {
    this.detectMode();
    this.buildForm();
    this.setupMarginCalculation();
    this.setupBarcodeValidation();
    this.loadCategories();
    if (this.isEditMode && this.productId) this.loadProduct(this.productId);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // INIT
  // ============================================

  private detectMode(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.productId  = parseInt(id);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      // Sección 1: Básica
      name:        ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      categoryId:  [null],
      isActive:    [true],

      // Sección 2: Códigos
      sku:     [''],
      barcode: [''],

      // Sección 3: Precios
      cost:       [null],
      price:      [null, [Validators.required, Validators.min(0)]],
      taxPercent: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      margin:     [{ value: '', disabled: true }]
    });
  }

  private setupMarginCalculation(): void {
    const update = () => {
      const price = parseFloat(this.form.get('price')?.value);
      const cost  = parseFloat(this.form.get('cost')?.value);
      if (price > 0 && cost > 0) {
        const margin = ((price - cost) / cost * 100).toFixed(1);
        this.form.get('margin')?.setValue(margin + '%', { emitEvent: false });
      } else {
        this.form.get('margin')?.setValue('—', { emitEvent: false });
      }
    };

    this.form.get('price')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(update);
    this.form.get('cost')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(update);
  }

  private setupBarcodeValidation(): void {
    this.barcodeCheckSubject.pipe(
      debounceTime(600),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(code => {
      if (!code?.trim()) { this.barcodeError = null; return; }
      this.barcodeChecking = true;
      this.productService.findByBarcode(code.trim())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            const found = res.data;
            // Si el código pertenece al mismo producto (edición), no es error
            if (found && found.id !== this.productId) {
              this.barcodeError = `Código ya registrado: "${found.name}"`;
            } else {
              this.barcodeError = null;
            }
            this.barcodeChecking = false;
          },
          error: () => {
            this.barcodeError = null; // 404 = no existe, OK
            this.barcodeChecking = false;
          }
        });
    });
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  loadCategories(): void {
    this.categoryService.getCategories('active')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.categories = this.flattenTree(res.data ?? []);
        }
      });
  }

  private flattenTree(nodes: any[]): CategoryFlat[] {
    const result: CategoryFlat[] = [];
    const recurse = (list: any[]) => {
      for (const n of list) {
        result.push({ id: n.id, name: n.name, level: n.level, parentId: n.parentId,
                      isActive: n.isActive, productCount: n.productCount,
                      description: n.description, hasChildren: n.children?.length > 0,
                      isExpanded: false });
        if (n.children?.length) recurse(n.children);
      }
    };
    recurse(nodes);
    return result;
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.productService.getProductById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.currentProduct = res.data ?? null;
          if (this.currentProduct) {
            this.patchForm(this.currentProduct);
            this.existingImageUrl = this.currentProduct.imageUrl
              ? 'http://localhost:3000' + this.currentProduct.imageUrl
              : null;
          }
          this.isLoading = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al cargar el producto');
          this.isLoading = false;
          this.router.navigate(['/products']);
        }
      });
  }

  private patchForm(p: Product): void {
    this.form.patchValue({
      name:        p.name,
      description: p.description ?? '',
      categoryId:  p.categoryId ?? null,
      isActive:    p.isActive,
      sku:         p.sku ?? '',
      barcode:     p.barcode ?? '',
      cost:        p.cost ?? null,
      price:       p.price,
      taxPercent:  p.taxPercent
    });
  }

  // ============================================
  // IMAGEN
  // ============================================

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      this.alertService.error('Formato no válido. Use JPG, PNG o WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.alertService.error('La imagen no puede superar 5MB');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.imagePreviewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.selectedFile    = null;
    this.imagePreviewUrl = null;
  }

  /** Subida directa en modo edición (botón aparte) */
  uploadImageNow(): void {
    if (!this.selectedFile || !this.productId) return;
    this.isUploadingImage = true;
    this.productService.uploadImage(this.productId, this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.alertService.success('Imagen actualizada exitosamente');
          this.existingImageUrl = 'http://localhost:3000' + (res.data?.imageUrl ?? '');
          this.selectedFile    = null;
          this.imagePreviewUrl = null;
          this.isUploadingImage = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al subir imagen');
          this.isUploadingImage = false;
        }
      });
  }

  // ============================================
  // SUBMIT
  // ============================================

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.barcodeError) return;

    const raw = this.form.getRawValue();
    const dto: any = {
      name:        raw.name?.trim(),
      description: raw.description?.trim() || undefined,
      categoryId:  raw.categoryId ? parseInt(raw.categoryId) : null,
      isActive:    raw.isActive,
      sku:         raw.sku?.trim() || undefined,
      barcode:     raw.barcode?.trim() || undefined,
      price:       parseFloat(raw.price),
      cost:        raw.cost ? parseFloat(raw.cost) : undefined,
      taxPercent:  parseFloat(raw.taxPercent)
    };

    this.isSaving = true;

    if (this.isEditMode) {
      this.productService.updateProduct(this.productId!, dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.alertService.success('Producto actualizado exitosamente');
            this.isSaving = false;
            this.router.navigate(['/products', this.productId]);
          },
          error: (err) => {
            this.alertService.error(err.message || 'Error al actualizar producto');
            this.isSaving = false;
          }
        });
    } else {
      this.productService.createProduct(dto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            const newId = res.data?.id;
            // Subir imagen si se seleccionó
            if (this.selectedFile && newId) {
              this.productService.uploadImage(newId, this.selectedFile)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    this.alertService.success('Producto creado con imagen exitosamente');
                    this.isSaving = false;
                    this.router.navigate(['/products', newId]);
                  },
                  error: () => {
                    this.alertService.success('Producto creado (no se pudo subir la imagen)');
                    this.isSaving = false;
                    this.router.navigate(['/products', newId]);
                  }
                });
            } else {
              this.alertService.success('Producto creado exitosamente');
              this.isSaving = false;
              this.router.navigate(['/products', newId]);
            }
          },
          error: (err) => {
            this.alertService.error(err.message || 'Error al crear producto');
            this.isSaving = false;
          }
        });
    }
  }

  saveAndCreateAnother(): void {
    if (this.form.invalid || this.barcodeError) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const dto: any = {
      name:        raw.name?.trim(),
      description: raw.description?.trim() || undefined,
      categoryId:  raw.categoryId ? parseInt(raw.categoryId) : null,
      isActive:    raw.isActive,
      sku:         raw.sku?.trim() || undefined,
      barcode:     raw.barcode?.trim() || undefined,
      price:       parseFloat(raw.price),
      cost:        raw.cost ? parseFloat(raw.cost) : undefined,
      taxPercent:  parseFloat(raw.taxPercent)
    };

    this.isSaving = true;
    this.productService.createProduct(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const newId = res.data?.id;
          if (this.selectedFile && newId) {
            this.productService.uploadImage(newId, this.selectedFile).subscribe();
          }
          this.alertService.success('Producto creado. Puedes crear otro.');
          this.form.reset({
            isActive: true, taxPercent: 15,
            name: '', description: '', sku: '', barcode: '',
            categoryId: raw.categoryId // mantener la categoría seleccionada
          });
          this.selectedFile    = null;
          this.imagePreviewUrl = null;
          this.barcodeError    = null;
          this.isSaving = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al crear producto');
          this.isSaving = false;
        }
      });
  }
}
