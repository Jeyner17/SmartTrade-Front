import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

import { ExpenseService } from '../../services/expense.service';
import { AlertService } from '../../../../core/services/alert.service';
import { ExpenseCategory, CreateExpenseDto, SUGGESTED_CATEGORIES } from '../../models/expense.model';

declare var bootstrap: any;

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './expense-form.component.html',
  styleUrls: ['./expense-form.component.css']
})
export class ExpenseFormComponent implements OnInit {

  @ViewChild('categoryModal') categoryModalEl!: ElementRef;

  form!: FormGroup;
  categoryForm!: FormGroup;

  isEditMode = false;
  expenseId?: number;
  saving = false;
  savingCategory = false;
  hasCashOpen = false;

  categories: ExpenseCategory[] = [];
  suppliers: { id: number; name: string }[] = [];

  // Receipt upload
  receiptFile?: File;
  receiptPreview?: string;
  receiptFileName = '';
  isImageFile = false;
  isDragOver = false;
  uploadProgress = 0;

  private categoryModalInstance: any;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private expenseService: ExpenseService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadCategories();
    this.checkCashSession();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.expenseId = +params['id'];
        this.loadExpense(this.expenseId);
      } else {
        // Default date = today
        const today = new Date().toISOString().split('T')[0];
        this.form.patchValue({ date: today });
      }
    });
  }

  private buildForms(): void {
    this.form = this.fb.group({
      date: ['', Validators.required],
      categoryId: ['', Validators.required],
      concept: ['', [Validators.required, Validators.minLength(3)]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      paymentMethod: ['CASH', Validators.required],
      receiptNumber: [''],
      supplierId: [null],
      notes: [''],
      deductFromCash: [false]
    });

    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      type: ['VARIABLE', Validators.required]
    });
  }

  private loadCategories(): void {
    this.expenseService.getCategories().subscribe({
      next: cats => this.categories = cats,
      error: () => {}
    });
  }

  private checkCashSession(): void {
    // Check from localStorage if there's an active cash session
    try {
      const cashData = localStorage.getItem('active_cash_session');
      this.hasCashOpen = !!cashData;
    } catch {
      this.hasCashOpen = false;
    }
  }

  private loadExpense(id: number): void {
    this.expenseService.getExpenseById(id).subscribe({
      next: exp => {
        this.form.patchValue({
          date: exp.date,
          categoryId: exp.categoryId,
          concept: exp.concept,
          amount: exp.amount,
          paymentMethod: exp.paymentMethod,
          receiptNumber: exp.receiptNumber || '',
          supplierId: exp.supplierId || null,
          notes: exp.notes || ''
        });
      },
      error: () => {
        this.alertService.error('No se pudo cargar el gasto');
        this.router.navigate(['/expenses']);
      }
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save(false);
  }

  saveAndCreateAnother(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save(true);
  }

  private save(createAnother: boolean): void {
    this.saving = true;
    const raw = this.form.value;

    const dto: CreateExpenseDto = {
      amount: parseFloat(raw.amount),
      categoryId: parseInt(raw.categoryId),
      concept: raw.concept.trim(),
      date: raw.date,
      paymentMethod: raw.paymentMethod,
      receiptNumber: raw.receiptNumber?.trim() || undefined,
      supplierId: raw.supplierId ? parseInt(raw.supplierId) : undefined,
      notes: raw.notes?.trim() || undefined
    };

    const obs$ = this.isEditMode
      ? this.expenseService.updateExpense(this.expenseId!, dto)
      : this.expenseService.createExpense(dto);

    obs$.subscribe({
      next: expense => {
        // Upload receipt if file selected (only on new)
        if (this.receiptFile && !this.isEditMode) {
          this.uploadReceiptFor(expense.id, createAnother);
        } else {
          this.saving = false;
          this.alertService.success(
            this.isEditMode ? 'Gasto actualizado correctamente' : 'Gasto registrado correctamente'
          );
          if (createAnother) {
            this.resetForm();
          } else {
            this.router.navigate(['/expenses']);
          }
        }
      },
      error: err => {
        this.saving = false;
        const msg = err?.error?.message || 'Error al guardar el gasto';
        this.alertService.error(msg);
      }
    });
  }

  private uploadReceiptFor(expenseId: number, createAnother: boolean): void {
    this.uploadProgress = 10;
    this.expenseService.uploadReceipt(expenseId, this.receiptFile!).subscribe({
      next: () => {
        this.uploadProgress = 100;
        this.saving = false;
        this.alertService.success('Gasto y comprobante guardados correctamente');
        if (createAnother) {
          this.resetForm();
        } else {
          this.router.navigate(['/expenses']);
        }
      },
      error: () => {
        this.uploadProgress = 0;
        this.saving = false;
        this.alertService.warning('Gasto guardado, pero hubo un error al subir el comprobante');
        this.router.navigate(['/expenses']);
      }
    });
  }

  private resetForm(): void {
    const today = new Date().toISOString().split('T')[0];
    this.form.reset({ date: today, paymentMethod: 'CASH', deductFromCash: false });
    this.clearReceipt();
    this.uploadProgress = 0;
  }

  cancel(): void { this.router.navigate(['/expenses']); }

  // ── Archivo comprobante ────────────────────────────────────────────────────

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
    if (file.size > 10 * 1024 * 1024) {
      this.alertService.error('El archivo supera el límite de 10MB');
      return;
    }
    this.receiptFile = file;
    this.receiptFileName = file.name;
    this.isImageFile = file.type.startsWith('image/');

    if (this.isImageFile) {
      const reader = new FileReader();
      reader.onload = () => this.receiptPreview = reader.result as string;
      reader.readAsDataURL(file);
    } else {
      this.receiptPreview = 'pdf';
    }
  }

  clearReceipt(): void {
    this.receiptFile = undefined;
    this.receiptPreview = undefined;
    this.receiptFileName = '';
    this.isImageFile = false;
  }

  // ── Modal Categoría ────────────────────────────────────────────────────────

  openCategoryModal(): void {
    this.categoryForm.reset({ type: 'VARIABLE' });
    const el = document.getElementById('categoryModal');
    if (el) {
      this.categoryModalInstance = new bootstrap.Modal(el);
      this.categoryModalInstance.show();
    }
  }

  closeCategoryModal(): void {
    this.categoryModalInstance?.hide();
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;
    this.savingCategory = true;
    this.expenseService.createCategory(this.categoryForm.value).subscribe({
      next: cat => {
        this.savingCategory = false;
        this.categories.push(cat);
        this.form.patchValue({ categoryId: cat.id });
        this.closeCategoryModal();
        this.alertService.success(`Categoría "${cat.name}" creada`);
      },
      error: () => {
        this.savingCategory = false;
        this.alertService.error('Error al crear categoría');
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl?.touched);
  }
}
