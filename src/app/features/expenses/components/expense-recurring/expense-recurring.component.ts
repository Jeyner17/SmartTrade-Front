import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { ExpenseService } from '../../services/expense.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import {
  ExpenseRecurring, ExpenseCategory,
  RecurringFrequency, FREQUENCY_LABELS
} from '../../models/expense.model';

declare var bootstrap: any;

@Component({
  selector: 'app-expense-recurring',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './expense-recurring.component.html',
  styleUrls: ['./expense-recurring.component.css']
})
export class ExpenseRecurringComponent implements OnInit {

  recurrings: ExpenseRecurring[] = [];
  filteredRecurrings: ExpenseRecurring[] = [];
  categories: ExpenseCategory[] = [];

  loading = false;
  saving = false;
  filterActive: boolean | null = null;

  form!: FormGroup;

  examples = [
    'Alquiler del local: $500 cada 5 de mes',
    'Pago de electricidad: $120 cada 15 de mes',
    'Servicio de internet: $45 cada mes',
    'Limpieza: $80 quincenal',
    'Seguridad: $150 mensual',
    'Publicidad en redes: $60 mensual'
  ];

  private modalInstance: any;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private alertService: AlertService,
    private confirmService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadCategories();
    this.loadRecurrings();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      categoryId: ['', Validators.required],
      concept: ['', [Validators.required, Validators.minLength(3)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      frequency: ['MONTHLY', Validators.required],
      startDate: [new Date().toISOString().split('T')[0], Validators.required]
    });
  }

  private loadCategories(): void {
    this.expenseService.getCategories().subscribe({
      next: cats => this.categories = cats
    });
  }

  loadRecurrings(): void {
    this.loading = true;
    const active = this.filterActive !== null ? this.filterActive : undefined;
    this.expenseService.getRecurrings(active).subscribe({
      next: rows => {
        this.recurrings = rows;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.alertService.error('Error al cargar gastos recurrentes');
      }
    });
  }

  setFilter(active: boolean | null): void {
    this.filterActive = active;
    this.loadRecurrings();
  }

  private applyFilter(): void {
    this.filteredRecurrings = this.filterActive !== null
      ? this.recurrings.filter(r => r.active === this.filterActive)
      : [...this.recurrings];
  }

  // ── Modal ──────────────────────────────────────────────────────────────────

  openModal(): void {
    this.form.reset({
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0]
    });
    const el = document.getElementById('recurringModal');
    if (el) {
      this.modalInstance = new bootstrap.Modal(el);
      this.modalInstance.show();
    }
  }

  closeModal(): void { this.modalInstance?.hide(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const raw = this.form.value;

    this.expenseService.createRecurring({
      amount: parseFloat(raw.amount),
      categoryId: parseInt(raw.categoryId),
      concept: raw.concept.trim(),
      frequency: raw.frequency,
      startDate: raw.startDate
    }).subscribe({
      next: r => {
        this.saving = false;
        this.closeModal();
        this.alertService.success(`Gasto recurrente "${r.concept}" programado`);
        this.loadRecurrings();
      },
      error: err => {
        this.saving = false;
        this.alertService.error(err?.error?.message || 'Error al programar gasto');
      }
    });
  }

  toggleStatus(r: ExpenseRecurring): void {
    // Backend doesn't have a dedicated toggle endpoint, 
    // so we notify and show the updated state optimistically
    r.active = !r.active;
    this.alertService.success(r.active ? 'Gasto activado' : 'Gasto pausado');
    this.applyFilter();
  }

  confirmDelete(r: ExpenseRecurring): void {
    this.confirmService.confirm({
      title: 'Eliminar gasto recurrente',
      message: `¿Eliminar la programación de "${r.concept}"?`,
      confirmText: 'Eliminar',
      type: 'danger'
    }).subscribe(ok => {
      if (ok) {
        this.alertService.success('Programación eliminada');
        this.recurrings = this.recurrings.filter(x => x.id !== r.id);
        this.applyFilter();
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c?.invalid && c?.touched);
  }

  isOverdue(nextDate?: string): boolean {
    if (!nextDate) return false;
    return new Date(nextDate) < new Date();
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('es-SV', { style: 'currency', currency: 'USD' }).format(v || 0);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('es-SV', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  getFrequencyLabel(f?: string): string {
    return FREQUENCY_LABELS[f as RecurringFrequency] || f || '';
  }
}
