import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    FormArray,
    Validators
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { SupplierService } from '../../services/supplier.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import {
    Supplier,
    SupplierStatus,
    CreateSupplierDto,
    PaymentTerms,
    PAYMENT_TERMS_LABELS
} from '../../models/supplier.model';

/**
 * Componente de Formulario de Proveedor (Crear / Editar)
 * Sprint 8 - Gestión de Proveedores
 */
@Component({
    selector: 'app-supplier-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LoaderComponent],
    templateUrl: './supplier-form.component.html',
    styles: []
})
export class SupplierFormComponent implements OnInit {

    form!: FormGroup;
    currentSupplier: Supplier | null = null;

    isEditMode = false;
    supplierId: number | null = null;

    isLoading = false;
    isSaving = false;

    paymentTermsOptions = Object.entries(PAYMENT_TERMS_LABELS)
        .map(([value, label]) => ({ value, label }));

    bankAccountTypeOptions = [
        { value: 'ahorros', label: 'Ahorros' },
        { value: 'corriente', label: 'Corriente' }
    ];

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private supplierService: SupplierService,
        private alertService: AlertService
    ) { }

    ngOnInit(): void {
        this.detectMode();
        this.buildForm();
        if (this.isEditMode && this.supplierId) this.loadSupplier(this.supplierId);
    }

    private detectMode(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditMode = true;
            this.supplierId = Number(id);
        }
    }

    private buildForm(): void {
        this.form = this.fb.group({
            // Datos Generales — nombres exactos del backend
            tradeName: ['', [Validators.required, Validators.maxLength(150)]],
            legalName: ['', Validators.maxLength(200)],
            ruc: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(20)]],
            address: ['', Validators.maxLength(300)],
            phone: ['', Validators.maxLength(20)],
            email: ['', [Validators.email, Validators.maxLength(150)]],
            notes: [''],

            // Contactos (FormArray)
            contacts: this.fb.array([this.buildContactGroup()]),

            // Datos bancarios — nombres exactos del backend
            bankName: ['', Validators.maxLength(100)],
            bankAccount: ['', Validators.maxLength(50)],
            bankAccountType: ['', Validators.maxLength(30)],
            paymentTerms: [''],

            // Estado del proveedor
            status: ['active']
        });
    }

    buildContactGroup(): FormGroup {
        return this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(150)]],
            position: ['', Validators.maxLength(100)],
            phone: ['', Validators.maxLength(20)],
            email: ['', [Validators.email, Validators.maxLength(100)]],
            isPrimary: [false]
        });
    }

    get contacts(): FormArray {
        return this.form.get('contacts') as FormArray;
    }

    addContact(): void { this.contacts.push(this.buildContactGroup()); }

    removeContact(index: number): void {
        if (this.contacts.length > 1) this.contacts.removeAt(index);
    }

    // ─── Carga modo edición ───────────────────────────────────────────────────

    private loadSupplier(id: number): void {
        this.isLoading = true;
        this.supplierService.getSupplierById(id).subscribe({
            next: response => {
                if (response.success && response.data) {
                    // Backend returns { supplier: {...}, purchaseStats: {...} }
                    const data: any = response.data;
                    const supplier: Supplier = data.supplier ?? data;
                    this.currentSupplier = supplier;
                    this.patchForm(supplier);
                }
                this.isLoading = false;
            },
            error: () => {
                this.alertService.error('Error al cargar el proveedor');
                this.isLoading = false;
                this.router.navigate(['/suppliers']);
            }
        });
    }

    private patchForm(s: Supplier): void {
        this.form.patchValue({
            tradeName: s.tradeName,
            legalName: s.legalName || '',
            ruc: s.ruc,
            address: s.address || '',
            phone: s.phone || '',
            email: s.email || '',
            notes: s.notes || '',
            bankName: s.bankName || '',
            bankAccount: s.bankAccount || '',
            bankAccountType: s.bankAccountType || '',
            paymentTerms: s.paymentTerms || '',
            status: s.status || 'active'
        });

        if (s.contacts && s.contacts.length > 0) {
            while (this.contacts.length < s.contacts.length) this.contacts.push(this.buildContactGroup());
            while (this.contacts.length > s.contacts.length) this.contacts.removeAt(this.contacts.length - 1);
            s.contacts.forEach((c, i) => {
                this.contacts.at(i).patchValue({
                    name: c.name || '',
                    position: c.position || '',
                    phone: c.phone || '',
                    email: c.email || '',
                    isPrimary: c.isPrimary || false
                });
            });
        }
    }

    // ─── Envío ────────────────────────────────────────────────────────────────

    submit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) {
            this.alertService.error('Por favor corrija los errores en el formulario');
            return;
        }
        this.isSaving = true;
        this.isEditMode ? this.updateSupplier() : this.createSupplier();
    }

    private buildDto(): CreateSupplierDto {
        const v = this.form.value;
        return {
            tradeName: v.tradeName,
            legalName: v.legalName || null,
            ruc: v.ruc,
            address: v.address || null,
            phone: v.phone || null,
            email: v.email || null,
            notes: v.notes || null,
            bankName: v.bankName || null,
            bankAccount: v.bankAccount || null,
            bankAccountType: v.bankAccountType || null,
            paymentTerms: (v.paymentTerms || null) as PaymentTerms | null,
            status: (v.status || 'active') as SupplierStatus,
            contacts: (v.contacts as any[])
                .filter(c => c.name?.trim())
                .map(c => ({
                    name: c.name,
                    position: c.position || null,
                    phone: c.phone || null,
                    email: c.email || null,
                    isPrimary: c.isPrimary || false
                }))
        };
    }

    private createSupplier(): void {
        this.supplierService.createSupplier(this.buildDto()).subscribe({
            next: response => {
                if (response.success && response.data) {
                    this.alertService.success('Proveedor creado exitosamente');
                    this.router.navigate(['/suppliers', response.data.id]);
                }
                this.isSaving = false;
            },
            error: error => {
                this.alertService.error(error?.message || 'Error al crear el proveedor');
                this.isSaving = false;
            }
        });
    }

    private updateSupplier(): void {
        this.supplierService.updateSupplier(this.supplierId!, this.buildDto()).subscribe({
            next: response => {
                if (response.success) {
                    this.alertService.success('Proveedor actualizado exitosamente');
                    this.router.navigate(['/suppliers', this.supplierId]);
                }
                this.isSaving = false;
            },
            error: error => {
                this.alertService.error(error?.message || 'Error al actualizar el proveedor');
                this.isSaving = false;
            }
        });
    }

    cancel(): void { this.router.navigate(['/suppliers']); }

    // ─── Helpers de validación ────────────────────────────────────────────────

    isFieldInvalid(field: string): boolean {
        const ctrl = this.form.get(field);
        return !!(ctrl && ctrl.invalid && ctrl.touched);
    }

    isFieldValid(field: string): boolean {
        const ctrl = this.form.get(field);
        return !!(ctrl && ctrl.valid && ctrl.touched);
    }

    isContactFieldInvalid(index: number, field: string): boolean {
        const ctrl = this.contacts.at(index)?.get(field);
        return !!(ctrl && ctrl.invalid && ctrl.touched);
    }

    getErrorMessage(field: string): string {
        const ctrl = this.form.get(field);
        if (!ctrl?.errors || !ctrl.touched) return '';
        if (ctrl.hasError('required')) return 'Este campo es requerido';
        if (ctrl.hasError('email')) return 'Email inválido';
        if (ctrl.hasError('minlength')) return `Mínimo ${ctrl.errors['minlength'].requiredLength} caracteres`;
        if (ctrl.hasError('maxlength')) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
        return 'Campo inválido';
    }

    getContactErrorMessage(index: number, field: string): string {
        const ctrl = this.contacts.at(index)?.get(field);
        if (!ctrl?.errors || !ctrl.touched) return '';
        if (ctrl.hasError('required')) return 'Este campo es requerido';
        if (ctrl.hasError('email')) return 'Email inválido';
        if (ctrl.hasError('maxlength')) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
        return 'Campo inválido';
    }
}
