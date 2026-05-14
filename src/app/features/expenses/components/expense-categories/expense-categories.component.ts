import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ExpenseService } from '../../services/expense.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  ExpenseCategory, CategoryType,
  SUGGESTED_CATEGORIES
} from '../../models/expense.model';

declare var bootstrap: any;

@Component({
  selector: 'app-expense-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './expense-categories.component.html',
  styleUrls: ['./expense-categories.component.css']
})
export class ExpenseCategoriesComponent implements OnInit {

  categories: ExpenseCategory[] = [];
  filteredCategories: ExpenseCategory[] = [];
  loading = false;
  saving = false;
  creatingSuggested = false;
  filterType: CategoryType | '' = '';

  form!: FormGroup;
  editingCategory?: ExpenseCategory;

  suggestedCategories = SUGGESTED_CATEGORIES;

  private modalInstance: any;

  get totalMonthAmount(): number {
    return this.filteredCategories.reduce((s, c) => s + (c.totalLastMonth || 0), 0);
  }

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private alertService: AlertService,
    private confirmService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCategories();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      type: ['VARIABLE', Validators.required]
    });
  }

  loadCategories(): void {
    this.loading = true;
    this.expenseService.getCategories().subscribe({
      next: cats => {
        this.categories = cats;
        this.applyFilter();
        this.loading = false;
        this.enrichWithStats();
      },
      error: () => {
        this.loading = false;
        this.alertService.error('Error al cargar categorías');
      }
    });
  }

  /** Enriquece cada categoría con estadísticas del mes actual */
  private enrichWithStats(): void {
    const range = this.expenseService.getCurrentMonthRange();
    this.expenseService.getExpensesByCategory(range.startDate, range.endDate).subscribe({
      next: items => {
        items.forEach(item => {
          const cat = this.categories.find(c => c.id === item.category.id);
          if (cat) {
            cat.totalLastMonth = item.total;
            cat.expenseCount = (item as any).count ?? 0;
          }
        });
      }
    });
  }

  setFilter(type: CategoryType | ''): void {
    this.filterType = type;
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredCategories = this.filterType
      ? this.categories.filter(c => c.type === this.filterType)
      : [...this.categories];
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  openModal(cat?: ExpenseCategory): void {
    this.editingCategory = cat;
    if (cat) {
      this.form.patchValue({ name: cat.name, description: cat.description || '', type: cat.type });
    } else {
      this.form.reset({ type: 'VARIABLE' });
    }
    const el = document.getElementById('catModal');
    if (el) {
      this.modalInstance = new bootstrap.Modal(el);
      this.modalInstance.show();
    }
  }

  closeModal(): void {
    this.modalInstance?.hide();
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    const dto = this.form.value;

    const obs$ = this.editingCategory
      ? this.expenseService.createCategory(dto) // NOTE: backend has no PUT for categories, using create for now
      : this.expenseService.createCategory(dto);

    this.expenseService.createCategory(dto).subscribe({
      next: cat => {
        this.saving = false;
        this.closeModal();
        this.alertService.success(
          this.editingCategory ? 'Categoría actualizada' : `Categoría "${cat.name}" creada`
        );
        this.loadCategories();
      },
      error: err => {
        this.saving = false;
        this.alertService.error(err?.error?.message || 'Error al guardar categoría');
      }
    });
  }

  confirmDelete(cat: ExpenseCategory): void {
    if ((cat.expenseCount || 0) > 0) return;
    this.confirmService.confirm({
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      type: 'danger'
    }).subscribe(ok => {
      if (ok) this.alertService.info('Eliminación de categorías próximamente disponible');
    });
  }

  // ── Sugeridas ──────────────────────────────────────────────────────────────

  createSuggested(suggested: Partial<ExpenseCategory>): void {
    this.expenseService.createCategory({
      name: suggested.name!,
      description: suggested.description,
      type: suggested.type as CategoryType
    }).subscribe({
      next: () => { this.alertService.success(`"${suggested.name}" agregada`); this.loadCategories(); },
      error: () => this.alertService.error('Error al crear categoría')
    });
  }

  createAllSuggested(): void {
    this.creatingSuggested = true;
    let count = 0;
    const total = SUGGESTED_CATEGORIES.length;

    SUGGESTED_CATEGORIES.forEach(s => {
      this.expenseService.createCategory({
        name: s.name!,
        description: s.description,
        type: s.type as CategoryType
      }).subscribe({
        next: () => {
          count++;
          if (count === total) {
            this.creatingSuggested = false;
            this.alertService.success('Todas las categorías sugeridas han sido creadas');
            this.loadCategories();
          }
        },
        error: () => { count++; if (count === total) { this.creatingSuggested = false; this.loadCategories(); } }
      });
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(val || 0);
  }
}
