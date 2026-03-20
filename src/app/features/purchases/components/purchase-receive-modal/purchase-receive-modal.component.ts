import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PurchaseOrder, PurchaseOrderLine } from '../../models/purchase.model';

interface ReceiveRow {
  productId: number;
  productName: string;
  quantityOrdered: number;
  quantityReceived: number;
  observation: string;
}

@Component({
  selector: 'app-purchase-receive-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './purchase-receive-modal.component.html',
  styleUrl: './purchase-receive-modal.component.css'
})
export class PurchaseReceiveModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() order: PurchaseOrder | null = null;
  @Input() isSaving = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<{ observations: string; products: Array<{ productId: number; quantityReceived: number }> }>();

  rows: ReceiveRow[] = [];
  receptionDate = new Date().toISOString().slice(0, 10);
  observations = '';
  updateInventory = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['order'] && this.order) {
      this.buildRows(this.order.details ?? []);
      this.receptionDate = new Date().toISOString().slice(0, 10);
      this.observations = '';
      this.updateInventory = true;
    }
  }

  private buildRows(details: PurchaseOrderLine[]): void {
    this.rows = details.map(line => ({
      productId: line.productId,
      productName: line.product?.name || `Producto #${line.productId}`,
      quantityOrdered: line.quantityOrdered,
      quantityReceived: line.quantityOrdered,
      observation: ''
    }));
  }

  getDifference(row: ReceiveRow): number {
    return row.quantityReceived - row.quantityOrdered;
  }

  getRowClass(row: ReceiveRow): string {
    const diff = this.getDifference(row);
    if (diff < 0) {
      return 'table-warning';
    }

    if (diff > 0) {
      return 'table-danger';
    }

    return '';
  }

  onCancel(): void {
    this.closed.emit();
  }

  onConfirm(): void {
    if (!this.updateInventory) {
      return;
    }

    const detailObservations = this.rows
      .filter(row => row.observation.trim().length > 0)
      .map(row => `${row.productName}: ${row.observation.trim()}`)
      .join(' | ');

    const finalObservations = [this.observations.trim(), detailObservations]
      .filter(Boolean)
      .join(' | ');

    this.confirmed.emit({
      observations: finalObservations,
      products: this.rows.map(row => ({
        productId: row.productId,
        quantityReceived: Number(row.quantityReceived) || 0
      }))
    });
  }
}
