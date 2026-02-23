import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { EmployeeService } from '../../services/employee.service';
import { AttendanceHistory, AttendanceRecord } from '../../models/employee.model';

/**
 * Componente de Historial de Asistencia
 * Sprint 4 - Gestión de Empleados
 */
@Component({
  selector: 'app-attendance-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './attendance-history.component.html',
  styles: []
})
export class AttendanceHistoryComponent implements OnInit {

  @Input() employeeId!: number;

  history: AttendanceHistory | null = null;
  isLoading = false;

  // Filtro de fechas — default: mes actual
  startDate = '';
  endDate = '';

  constructor(private employeeService: EmployeeService) {}

  ngOnInit(): void {
    this.initDateRange();
    this.loadHistory();
  }

  private initDateRange(): void {
    const now = new Date();
    const year  = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    this.startDate = `${year}-${month}-01`;
    this.endDate   = now.toISOString().split('T')[0];
  }

  loadHistory(): void {
    this.isLoading = true;
    this.employeeService.getAttendanceHistory(this.employeeId, {
      startDate: this.startDate,
      endDate:   this.endDate,
      limit: 31
    }).subscribe({
      next: response => {
        if (response.success && response.data) {
          this.history = response.data;
        }
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  applyFilter(): void {
    this.loadHistory();
  }

  setCurrentMonth(): void {
    this.initDateRange();
    this.loadHistory();
  }

  setPreviousMonth(): void {
    const now = new Date();
    const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    const paddedMonth = String(month).padStart(2, '0');
    const lastDay = new Date(year, month, 0).getDate();
    this.startDate = `${year}-${paddedMonth}-01`;
    this.endDate   = `${year}-${paddedMonth}-${lastDay}`;
    this.loadHistory();
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  formatTime(isoString: string | null): string {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('es', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  getRowClass(record: AttendanceRecord): string {
    if (!record.entryTime) return 'table-danger';
    if (!record.exitTime)  return 'table-warning';
    return '';
  }

  getTotalHoursFormatted(): string {
    const total = this.history?.summary.totalHours ?? 0;
    const hours   = Math.floor(total);
    const minutes = Math.round((total - hours) * 60);
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
}
