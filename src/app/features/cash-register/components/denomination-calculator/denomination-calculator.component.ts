import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DenominationCount, DENOMINATION_ALL } from '../../models/cash-register.model';

/**
 * Calculadora de Denominaciones reutilizable
 * Usada en: Apertura, Cierre, Retiro a Caja Fuerte
 */
@Component({
  selector: 'app-denomination-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './denomination-calculator.component.html',
  styleUrl: './denomination-calculator.component.css'
})
export class DenominationCalculatorComponent implements OnInit, OnChanges {

  /** Lista de denominaciones a mostrar. Si no se pasa, usa DENOMINATION_ALL por defecto */
  @Input() denominations: Omit<DenominationCount, 'quantity' | 'subtotal'>[] = DENOMINATION_ALL;

  /** Emite cuando cambia el total */
  @Output() totalChange = new EventEmitter<number>();

  /** Emite la lista completa de denominaciones con cantidades */
  @Output() denominationsChange = new EventEmitter<DenominationCount[]>();

  /** Estado interno */
  rows: DenominationCount[] = [];

  get total(): number {
    return this.rows.reduce((sum, r) => sum + r.subtotal, 0);
  }

  get billRows(): DenominationCount[] {
    return this.rows.filter(r => r.type === 'bill');
  }

  get coinRows(): DenominationCount[] {
    return this.rows.filter(r => r.type === 'coin');
  }

  ngOnInit(): void {
    // Inicializar siempre, usando DENOMINATION_ALL como fallback si el input llega vacío
    this.initRows();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['denominations'] && this.denominations?.length) {
      this.initRows();
    }
  }

  private initRows(): void {
    const source = this.denominations?.length ? this.denominations : DENOMINATION_ALL;
    this.rows = source.map(d => ({
      ...d,
      quantity: 0,
      subtotal: 0
    }));
  }

  onQuantityChange(row: DenominationCount): void {
    const qty = Math.max(0, Math.floor(row.quantity || 0));
    row.quantity = qty;
    row.subtotal = parseFloat((qty * row.denomination).toFixed(2));
    this.totalChange.emit(this.total);
    this.denominationsChange.emit(this.rows.filter(r => r.quantity > 0));
  }

  reset(): void {
    this.rows.forEach(r => { r.quantity = 0; r.subtotal = 0; });
    this.totalChange.emit(0);
    this.denominationsChange.emit([]);
  }
}
