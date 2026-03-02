import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SupplierEvaluationModalComponent } from '../supplier-evaluation-modal/supplier-evaluation-modal.component';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import {
    Supplier,
    SupplierFilters,
    SupplierStatus,
    SUPPLIER_STATUS_LABELS,
    SUPPLIER_STATUS_BADGE
} from '../../models/supplier.model';

/**
 * Componente de Lista de Proveedores
 * Sprint 8 - Gestión de Proveedores
 */
@Component({
    selector: 'app-supplier-list',
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, LoaderComponent, SupplierEvaluationModalComponent],
    templateUrl: './supplier-list.component.html',
    styles: [`
    .supplier-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #0d6efd, #6610f2);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
    }
    .star-display { color: #ffc107; font-size: 0.9rem; }
    .star-empty   { color: #dee2e6; font-size: 0.9rem; }
  `]
})
export class SupplierListComponent implements OnInit, OnDestroy {

    suppliers: Supplier[] = [];
    pagination: any = null;

    isLoading = false;
    isActionLoading = false;

    // filtro status usa 'active'|'inactive'|'suspended' igual que el backend
    filters: SupplierFilters = { page: 1, limit: 10 };
    searchTerm = '';
    selectedStatus = '';   // '' = todos

    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;

    // Modal confirmación
    showConfirmModal = false;
    confirmTitle = '';
    confirmMessage = '';
    confirmAction: (() => void) | null = null;

    // Modal evaluación
    showEvalModal = false;
    selectedSupplierForEval: Supplier | null = null;

    readonly SUPPLIER_STATUS_LABELS = SUPPLIER_STATUS_LABELS;
    readonly SUPPLIER_STATUS_BADGE = SUPPLIER_STATUS_BADGE;

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    constructor(
        private supplierService: SupplierService,
        private authService: AuthService,
        private alertService: AlertService
    ) {
        const { MODULES, ACTIONS } = AUTH_CONSTANTS;
        this.canCreate = this.authService.hasPermission(MODULES.SUPPLIERS, ACTIONS.CREATE);
        this.canEdit = this.authService.hasPermission(MODULES.SUPPLIERS, ACTIONS.EDIT);
        this.canDelete = this.authService.hasPermission(MODULES.SUPPLIERS, ACTIONS.DELETE);
    }

    ngOnInit(): void {
        this.setupSearch();
        this.loadSuppliers();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private setupSearch(): void {
        this.searchSubject.pipe(
            debounceTime(400),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(term => {
            this.filters.search = term || undefined;
            this.filters.page = 1;
            this.loadSuppliers();
        });
    }

    loadSuppliers(): void {
        this.isLoading = true;
        this.supplierService.getSuppliers({ ...this.filters }).subscribe({
            next: response => {
                if (response.success && response.data) {
                    this.suppliers = response.data.suppliers;
                    this.pagination = response.data.pagination;
                }
                this.isLoading = false;
            },
            error: () => {
                this.alertService.error('Error al cargar los proveedores');
                this.isLoading = false;
            }
        });
    }

    onSearch(term: string): void { this.searchSubject.next(term); }

    onStatusFilter(): void {
        this.filters.status = (this.selectedStatus as SupplierStatus) || undefined;
        this.filters.page = 1;
        this.loadSuppliers();
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.selectedStatus = '';
        this.filters = { page: 1, limit: 10 };
        this.loadSuppliers();
    }

    onPageChange(page: number): void {
        this.filters.page = page;
        this.loadSuppliers();
    }

    // ─── Helpers visuales ────────────────────────────────────────────────────────

    // helper para calcular estrelllas desde overallRating
    getStarRange(): number[] { return [1, 2, 3, 4, 5]; }

    getInitials(supplier: Supplier): string {
        return supplier.tradeName?.charAt(0)?.toUpperCase() || 'P';
    }

    getPrimaryContact(supplier: Supplier): string {
        const c = supplier.contacts?.find(x => x.isPrimary) || supplier.contacts?.[0];
        return c ? c.name : '—';
    }

    getPrimaryPhone(supplier: Supplier): string {
        const c = supplier.contacts?.find(x => x.isPrimary) || supplier.contacts?.[0];
        return c?.phone || supplier.phone || '—';
    }

    getStatusBadge(status: SupplierStatus): string {
        return SUPPLIER_STATUS_BADGE[status] || 'bg-secondary-subtle text-secondary';
    }

    getStatusLabel(status: SupplierStatus): string {
        return SUPPLIER_STATUS_LABELS[status] || status;
    }

    isActive(supplier: Supplier): boolean {
        return supplier.status === 'active';
    }

    // ─── Toggle Estado ───────────────────────────────────────────────────────────

    confirmToggleStatus(supplier: Supplier): void {
        const toActive = supplier.status !== 'active';
        const newStatus = toActive ? 'active' : 'inactive';
        const action = toActive ? 'activar' : 'desactivar';
        this.confirmTitle = `${toActive ? 'Activar' : 'Desactivar'} Proveedor`;
        this.confirmMessage = `¿Está seguro que desea ${action} a "${supplier.tradeName}"?`;
        this.confirmAction = () => this.doChangeStatus(supplier, newStatus as SupplierStatus);
        this.showConfirmModal = true;
    }

    private doChangeStatus(supplier: Supplier, newStatus: SupplierStatus): void {
        this.isActionLoading = true;
        this.supplierService.changeStatus(supplier.id, { status: newStatus }).subscribe({
            next: response => {
                if (response.success) {
                    const msg = newStatus === 'active' ? 'Proveedor activado' : 'Proveedor desactivado';
                    this.alertService.success(msg);
                    this.loadSuppliers();
                }
                this.isActionLoading = false;
            },
            error: () => {
                this.alertService.error('Error al cambiar el estado del proveedor');
                this.isActionLoading = false;
            }
        });
    }

    // ─── Eliminación ─────────────────────────────────────────────────────────────

    confirmDelete(supplier: Supplier): void {
        this.confirmTitle = 'Eliminar Proveedor';
        this.confirmMessage = `¿Está seguro que desea eliminar a "${supplier.tradeName}"? Esta acción no se puede deshacer.`;
        this.confirmAction = () => this.deleteSupplier(supplier.id);
        this.showConfirmModal = true;
    }

    executeConfirm(): void {
        if (this.confirmAction) this.confirmAction();
        this.closeConfirmModal();
    }

    closeConfirmModal(): void {
        this.showConfirmModal = false;
        this.confirmAction = null;
    }

    private deleteSupplier(id: number): void {
        this.isActionLoading = true;
        this.supplierService.deleteSupplier(id).subscribe({
            next: response => {
                if (response.success) {
                    this.alertService.success('Proveedor eliminado exitosamente');
                    this.loadSuppliers();
                }
                this.isActionLoading = false;
            },
            error: () => {
                this.alertService.error('Error al eliminar el proveedor');
                this.isActionLoading = false;
            }
        });
    }

    // ─── Modal Evaluación ────────────────────────────────────────────────────────

    openEvalModal(supplier: Supplier): void {
        this.selectedSupplierForEval = supplier;
        this.showEvalModal = true;
    }

    onEvalModalClosed(): void {
        this.showEvalModal = false;
        this.selectedSupplierForEval = null;
    }

    onEvaluated(): void {
        this.showEvalModal = false;
        this.selectedSupplierForEval = null;
        this.loadSuppliers();
    }

    // ─── Paginación ──────────────────────────────────────────────────────────────

    getPages(): number[] {
        if (!this.pagination) return [];
        return Array.from({ length: this.pagination.pages }, (_, i) => i + 1);
    }

    getFirstItem(): number {
        if (!this.pagination) return 0;
        return (this.pagination.page - 1) * this.pagination.limit + 1;
    }

    getLastItem(): number {
        if (!this.pagination) return 0;
        return Math.min(this.pagination.page * this.pagination.limit, this.pagination.total);
    }
}
