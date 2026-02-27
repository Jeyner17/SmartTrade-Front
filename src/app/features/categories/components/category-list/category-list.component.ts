import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { CategoryService } from '../../services/category.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import { Category, CategoryFlat, CreateCategoryDto, UpdateCategoryDto } from '../../models/category.model';

const { MODULES, ACTIONS } = AUTH_CONSTANTS;

/**
 * Componente de Lista de Categorías — Vista árbol / tabla con búsqueda
 * Sprint 5 - Gestión de Categorías
 */
@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnInit, OnDestroy {

  // Datos
  tree: Category[] = [];
  flatList: CategoryFlat[] = [];   // respeta expand/collapse (vista árbol)
  allFlat: CategoryFlat[] = [];    // siempre totalmente expandido (vista tabla)

  // Vista y filtros
  viewMode: 'tree' | 'grid' = 'tree';
  statusFilter: 'active' | 'inactive' | 'all' = 'all';
  searchTerm = '';
  private searchSubject = new Subject<string>();

  // Estado carga
  isLoading = false;
  isSubmitting = false;

  // Permisos
  canCreate = false;
  canEdit   = false;
  canDelete = false;

  // Modal
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  editingId: number | null = null;
  form!: FormGroup;

  parentOptions: CategoryFlat[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private authService: AuthService,
    private alertService: AlertService,
    private confirmationService: ConfirmationService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.canCreate = this.authService.hasPermission(MODULES.CATEGORIES, ACTIONS.CREATE);
    this.canEdit   = this.authService.hasPermission(MODULES.CATEGORIES, ACTIONS.EDIT);
    this.canDelete = this.authService.hasPermission(MODULES.CATEGORIES, ACTIONS.DELETE);
    this.initForm();
    this.loadCategories();

    // Debounce en búsqueda (solo actualiza el término; la lista se filtra con el getter)
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(term => { this.searchTerm = term; });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================
  // LISTA VISIBLE (getter con búsqueda aplicada)
  // ============================================

  get displayList(): CategoryFlat[] {
    const q = this.searchTerm.trim().toLowerCase();
    const source = this.viewMode === 'grid' ? this.allFlat : this.flatList;
    if (!q) return source;
    return source.filter(f =>
      f.name.toLowerCase().includes(q) ||
      (f.description?.toLowerCase().includes(q))
    );
  }

  onSearchInput(value: string): void {
    this.searchSubject.next(value);
  }

  setView(mode: 'tree' | 'grid'): void {
    this.viewMode = mode;
  }

  // ============================================
  // CARGA Y ÁRBOL
  // ============================================

  loadCategories(): void {
    this.isLoading = true;
    this.categoryService.getCategories(this.statusFilter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.tree    = res.data ?? [];
          this.flatList = this.flattenTree(this.tree, this.flatList);
          this.allFlat  = this._flattenAll(this.tree);
          this.isLoading = false;
        },
        error: (err) => {
          this.alertService.error(err.message || 'Error al cargar categorías');
          this.isLoading = false;
        }
      });
  }

  /** Aplana preservando estado de expansión previo */
  private flattenTree(nodes: Category[], prev: CategoryFlat[]): CategoryFlat[] {
    const prevMap = new Map(prev.map(f => [f.id, f.isExpanded]));
    return this._flatten(nodes, prevMap);
  }

  private _flatten(nodes: Category[], prevMap: Map<number, boolean>): CategoryFlat[] {
    const result: CategoryFlat[] = [];
    for (const node of nodes) {
      const isExpanded = prevMap.get(node.id) ?? true;
      result.push({
        id:           node.id,
        name:         node.name,
        description:  node.description,
        parentId:     node.parentId,
        level:        node.level,
        isActive:     node.isActive,
        productCount: node.productCount,
        hasChildren:  node.children?.length > 0,
        isExpanded
      });
      if (isExpanded && node.children?.length) {
        result.push(...this._flatten(node.children, prevMap));
      }
    }
    return result;
  }

  /** Aplana el árbol completo sin respetar estado (para vista tabla) */
  private _flattenAll(nodes: Category[]): CategoryFlat[] {
    const result: CategoryFlat[] = [];
    for (const node of nodes) {
      result.push({
        id:           node.id,
        name:         node.name,
        description:  node.description,
        parentId:     node.parentId,
        level:        node.level,
        isActive:     node.isActive,
        productCount: node.productCount,
        hasChildren:  node.children?.length > 0,
        isExpanded:   true
      });
      if (node.children?.length) {
        result.push(...this._flattenAll(node.children));
      }
    }
    return result;
  }

  toggleExpand(item: CategoryFlat): void {
    item.isExpanded = !item.isExpanded;
    this.flatList = this._flatten(
      this.tree,
      new Map(this.flatList.map(f => [f.id, f.isExpanded]))
    );
  }

  getIndent(level: number): string {
    return `${level * 24}px`;
  }

  onFilterChange(): void {
    this.loadCategories();
  }

  // ============================================
  // MODAL
  // ============================================

  private initForm(): void {
    this.form = this.fb.group({
      name:        ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      parentId:    [null],
      isActive:    [true]
    });
  }

  openCreateModal(): void {
    this.modalMode = 'create';
    this.editingId = null;
    this.form.reset({ name: '', description: '', parentId: null, isActive: true });
    this.buildParentOptions(null);
    this.showModal = true;
  }

  openEditModal(item: CategoryFlat): void {
    this.modalMode = 'edit';
    this.editingId = item.id;
    this.form.reset({
      name:        item.name,
      description: item.description ?? '',
      parentId:    item.parentId,
      isActive:    item.isActive
    });
    this.buildParentOptions(item.id);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  private buildParentOptions(excludeId: number | null): void {
    if (excludeId === null) {
      this.parentOptions = [...this.allFlat];
      return;
    }
    const excluded = this.getDescendantIds(excludeId);
    excluded.add(excludeId);
    this.parentOptions = this.allFlat.filter(f => !excluded.has(f.id));
  }

  private getDescendantIds(parentId: number): Set<number> {
    const ids = new Set<number>();
    const queue = [parentId];
    while (queue.length) {
      const pid = queue.shift()!;
      this.allFlat.filter(f => f.parentId === pid).forEach(f => {
        ids.add(f.id);
        queue.push(f.id);
      });
    }
    return ids;
  }

  isFormInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  submitForm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const dto = {
      name:        raw.name?.trim(),
      description: raw.description?.trim() || undefined,
      parentId:    raw.parentId ? parseInt(raw.parentId) : null,
      isActive:    raw.isActive
    };

    this.isSubmitting = true;

    if (this.modalMode === 'create') {
      this.categoryService.createCategory(dto as CreateCategoryDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.alertService.success('Categoría creada exitosamente');
            this.closeModal();
            this.loadCategories();
            this.isSubmitting = false;
          },
          error: (err) => {
            this.alertService.error(err.message || 'Error al crear categoría');
            this.isSubmitting = false;
          }
        });
    } else {
      this.categoryService.updateCategory(this.editingId!, dto as UpdateCategoryDto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.alertService.success('Categoría actualizada exitosamente');
            this.closeModal();
            this.loadCategories();
            this.isSubmitting = false;
          },
          error: (err) => {
            this.alertService.error(err.message || 'Error al actualizar categoría');
            this.isSubmitting = false;
          }
        });
    }
  }

  // ============================================
  // ACCIONES DE FILA
  // ============================================

  toggleStatus(item: CategoryFlat): void {
    const action  = item.isActive ? 'desactivar' : 'activar';
    const cascade = item.isActive && item.hasChildren
      ? ' Todas sus subcategorías también serán desactivadas.'
      : '';

    this.confirmationService.confirm({
      title:       `${item.isActive ? 'Desactivar' : 'Activar'} categoría`,
      message:     `¿Está seguro que desea ${action} la categoría "${item.name}"?${cascade}`,
      confirmText: item.isActive ? 'Desactivar' : 'Activar',
      cancelText:  'Cancelar',
      type:        item.isActive ? 'warning' : 'info'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.categoryService.toggleStatus(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.alertService.success(res.data?.message || `Categoría ${action}da exitosamente`);
            this.loadCategories();
          },
          error: (err) => this.alertService.error(err.message || `Error al ${action} categoría`)
        });
    });
  }

  deleteCategory(item: CategoryFlat): void {
    this.confirmationService.confirm({
      title:       'Eliminar categoría',
      message:     `¿Está seguro que desea eliminar "${item.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText:  'Cancelar',
      type:        'danger'
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.categoryService.deleteCategory(item.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.alertService.success('Categoría eliminada exitosamente');
            this.loadCategories();
          },
          error: (err) => this.alertService.error(err.message || 'Error al eliminar categoría')
        });
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  getParentName(parentId: number | null): string {
    if (!parentId) return '—';
    const found = this.allFlat.find(f => f.id === parentId);
    return found ? found.name : '—';
  }

  trackById(_: number, item: CategoryFlat): number {
    return item.id;
  }
}
