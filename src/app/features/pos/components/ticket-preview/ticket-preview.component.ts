import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PosService } from '../../services/pos.service';
import { PosSale } from '../../models/pos.model';
import { AlertService } from '../../../../core/services/alert.service';

@Component({
  selector: 'app-ticket-preview',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './ticket-preview.component.html',
  styleUrl: './ticket-preview.component.css'
})
export class TicketPreviewComponent implements OnInit {
  sale: PosSale | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private posService: PosService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/pos']);
      return;
    }
    this.loadSale(id);
  }

  loadSale(id: number): void {
    this.isLoading = true;
    this.posService.getSaleById(id).subscribe({
      next: (res) => {
        this.sale = res.data || null;
        this.isLoading = false;
      },
      error: (err) => {
        this.alertService.error(err?.error?.message || 'No se pudo cargar el ticket');
        this.isLoading = false;
      }
    });
  }

  print(): void {
    window.print();
  }
}
