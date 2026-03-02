import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';

import { SupplierService } from '../../services/supplier.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { SupplierEvaluationModalComponent } from '../supplier-evaluation-modal/supplier-evaluation-modal.component';
import { AUTH_CONSTANTS } from '../../../../core/constants/auth.constants';
import {
    Supplier,
    SupplierPurchaseHistory,
    SupplierStats,
    PurchaseRecord,
    PurchaseStatus,
    SupplierStatus,
    PURCHASE_STATUS_LABELS,
    PURCHASE_STATUS_BADGE,
    PAYMENT_TERMS_LABELS,
    SUPPLIER_STATUS_LABELS,
    SUPPLIER_STATUS_BADGE
} from '../../models/supplier.model';

/**
 * Componente de Detalle de Proveedor
 * Sprint 8 - Gestión de Proveedores
 */
@Component({
    selector: 'app-supplier-detail',
    standalone: true,
    imports: [CommonModule, RouterLink, LoaderComponent, SupplierEvaluationModalComponent],
    templateUrl: './supplier-detail.component.html',
    styles: [`
    .stat-card { border-left: 4px solid; transition: transform .15s; }
    .stat-card:hover { transform: translateY(-2px); }
    .star-display { color: #ffc107; font-size: 1.1rem; }
    .star-empty   { color: #dee2e6; font-size: 1.1rem; }
  `]
})
export class SupplierDetailComponent implements OnInit {

    supplier: Supplier | null = null;
    recentPurchases: PurchaseRecord[] = [];
    stats: SupplierStats | null = null;

    isLoading = false;
    isLoadingHistory = false;
    supplierId: number | null = null;

    showEvalModal = false;
    canEdit: boolean;

    readonly PURCHASE_STATUS_LABELS = PURCHASE_STATUS_LABELS;
    readonly PURCHASE_STATUS_BADGE = PURCHASE_STATUS_BADGE;
    readonly PAYMENT_TERMS_LABELS = PAYMENT_TERMS_LABELS;
    readonly SUPPLIER_STATUS_LABELS = SUPPLIER_STATUS_LABELS;
    readonly SUPPLIER_STATUS_BADGE = SUPPLIER_STATUS_BADGE;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private supplierService: SupplierService,
        private authService: AuthService,
        private alertService: AlertService
    ) {
        const { MODULES, ACTIONS } = AUTH_CONSTANTS;
        this.canEdit = this.authService.hasPermission(MODULES.SUPPLIERS, ACTIONS.EDIT);
    }

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (!id) { this.router.navigate(['/suppliers']); return; }
        this.supplierId = Number(id);
        this.loadSupplier();
        this.loadPurchaseHistory();
    }

    loadSupplier(): void {
        this.isLoading = true;
        this.supplierService.getSupplierById(this.supplierId!).subscribe({
            next: response => {
                if (response.success && response.data) {
                    // Backend returns { supplier: {...}, purchaseStats: {...} }
                    const data: any = response.data;
                    this.supplier = data.supplier ?? data;
                } else {
                    this.router.navigate(['/suppliers']);
                }
                this.isLoading = false;
            },
            error: () => {
                this.alertService.error('Error al cargar el proveedor');
                this.router.navigate(['/suppliers']);
                this.isLoading = false;
            }
        });
    }

    loadPurchaseHistory(): void {
        this.isLoadingHistory = true;
        this.supplierService.getPurchaseHistory(this.supplierId!, { page: 1, limit: 10 }).subscribe({
            next: response => {
                if (response.success && response.data) {
                    this.recentPurchases = response.data.purchases;
                    this.stats = response.data.stats;
                }
                this.isLoadingHistory = false;
            },
            error: () => { this.isLoadingHistory = false; }
        });
    }

    // ─── Estrellas ─────────────────────────────────────────────────────────────

    getStarRange(): number[] { return [1, 2, 3, 4, 5]; }

    // ─── Modal Evaluación ──────────────────────────────────────────────────────

    openEvalModal(): void { this.showEvalModal = true; }
    closeEvalModal(): void { this.showEvalModal = false; }

    onEvaluated(): void {
        this.showEvalModal = false;
        this.loadSupplier();
        this.loadPurchaseHistory();
    }

    // ─── Helpers ───────────────────────────────────────────────────────────────

    getStatusBadge(status: SupplierStatus): string {
        return SUPPLIER_STATUS_BADGE[status] || 'bg-secondary-subtle text-secondary';
    }

    getPurchaseBadge(status: PurchaseStatus): string {
        return PURCHASE_STATUS_BADGE[status] || 'bg-secondary';
    }

    getPurchaseLabel(status: PurchaseStatus): string {
        return PURCHASE_STATUS_LABELS[status] || status;
    }

    getPaymentTermLabel(term: string | null): string {
        if (!term) return '—';
        return PAYMENT_TERMS_LABELS[term as keyof typeof PAYMENT_TERMS_LABELS] || term;
    }

    formatCurrency(amount: number | null): string {
        if (amount == null) return '—';
        return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount);
    }

    goBack(): void { this.router.navigate(['/suppliers']); }
}
