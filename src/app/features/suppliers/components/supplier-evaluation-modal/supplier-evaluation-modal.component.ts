import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SupplierService } from '../../services/supplier.service';
import { AlertService } from '../../../../core/services/alert.service';
import { Supplier, EvaluateSupplierDto } from '../../models/supplier.model';

/**
 * Modal de Evaluación de Proveedor
 * Sprint 8 - Gestión de Proveedores
 */
@Component({
    selector: 'app-supplier-evaluation-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './supplier-evaluation-modal.component.html',
    styles: [`
    .star-btn {
      background: none;
      border: none;
      padding: 2px 4px;
      font-size: 1.6rem;
      cursor: pointer;
      transition: transform .1s;
      line-height: 1;
    }
    .star-btn:hover { transform: scale(1.2); }
    .star-active { color: #ffc107; }
    .star-hover  { color: #ffda6a; }
    .star-empty  { color: #dee2e6; }
  `]
})
export class SupplierEvaluationModalComponent implements OnChanges {

    @Input() supplier!: Supplier;
    @Input() visible = false;
    @Output() closed = new EventEmitter<void>();
    @Output() evaluated = new EventEmitter<void>();

    qualityRating = 0;
    punctualityRating = 0;
    observations = '';

    hoverQuality = 0;
    hoverPunctuality = 0;

    isSaving = false;

    readonly stars = [1, 2, 3, 4, 5];

    constructor(
        private supplierService: SupplierService,
        private alertService: AlertService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['visible']?.currentValue === true) {
            this.resetForm();
        }
    }

    private resetForm(): void {
        this.qualityRating = 0;
        this.punctualityRating = 0;
        this.observations = '';
        this.hoverQuality = 0;
        this.hoverPunctuality = 0;
    }

    // ─── Estrellas de Calidad ─────────────────────────────────────────────────
    setQuality(val: number): void { this.qualityRating = val; }
    hoverQ(val: number): void { this.hoverQuality = val; }
    clearHoverQ(): void { this.hoverQuality = 0; }

    getQualityClass(star: number): string {
        const active = this.hoverQuality || this.qualityRating;
        if (star <= active) return this.hoverQuality ? 'star-hover' : 'star-active';
        return 'star-empty';
    }

    // ─── Estrellas de Puntualidad ─────────────────────────────────────────────
    setPunctuality(val: number): void { this.punctualityRating = val; }
    hoverP(val: number): void { this.hoverPunctuality = val; }
    clearHoverP(): void { this.hoverPunctuality = 0; }

    getPunctualityClass(star: number): string {
        const active = this.hoverPunctuality || this.punctualityRating;
        if (star <= active) return this.hoverPunctuality ? 'star-hover' : 'star-active';
        return 'star-empty';
    }

    // ─── Envío ────────────────────────────────────────────────────────────────

    getRatingLabel(val: number): string {
        const labels = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];
        return labels[val] || '';
    }

    save(): void {
        if (!this.qualityRating || !this.punctualityRating) {
            this.alertService.error('Debes seleccionar la calificación de calidad y puntualidad');
            return;
        }
        const dto: EvaluateSupplierDto = {
            qualityRating: this.qualityRating,
            punctualityRating: this.punctualityRating,
            observations: this.observations.trim() || null
        };
        this.isSaving = true;
        this.supplierService.evaluateSupplier(this.supplier.id, dto).subscribe({
            next: response => {
                if (response.success) {
                    this.alertService.success('Evaluación registrada exitosamente');
                    this.evaluated.emit();
                }
                this.isSaving = false;
            },
            error: error => {
                this.alertService.error(error?.message || 'Error al registrar la evaluación');
                this.isSaving = false;
            }
        });
    }

    close(): void { this.closed.emit(); }
}
