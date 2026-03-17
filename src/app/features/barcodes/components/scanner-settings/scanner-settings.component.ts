import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BarcodeService } from '../../services/barcode.service';
import {
  ScannerConfig, ScannerType, BarcodeFormat, CameraFacing, CameraResolution,
  SCANNER_TYPE_LABELS, BARCODE_FORMAT_LABELS, CAMERA_RESOLUTION_LABELS, DEFAULT_SCANNER_CONFIG
} from '../../models/barcode.model';

/**
 * Pantalla 5 – Configuración del Escáner
 * Sprint 11 - Barcode/QR Module
 */
@Component({
  selector: 'app-scanner-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './scanner-settings.component.html',
  styleUrl: './scanner-settings.component.css'
})
export class ScannerSettingsComponent implements OnInit {

  readonly SCANNER_TYPE_LABELS = SCANNER_TYPE_LABELS;
  readonly BARCODE_FORMAT_LABELS = BARCODE_FORMAT_LABELS;
  readonly CAMERA_RESOLUTION_LABELS = CAMERA_RESOLUTION_LABELS;

  readonly scannerTypes: ScannerType[] = ['usb', 'camera', 'both'];
  readonly barcodeFormats: BarcodeFormat[] = ['EAN-13', 'UPC', 'Code-128', 'QR', 'all'];
  readonly cameraFacings: CameraFacing[] = ['front', 'back'];
  readonly cameraResolutions: CameraResolution[] = ['low', 'medium', 'high', 'hd'];

  config: ScannerConfig = { ...DEFAULT_SCANNER_CONFIG };

  isLoading = false;
  isSaving = false;
  saveSuccess = false;
  errorMessage = '';

  // Modo de prueba
  testMode = false;
  testBuffer = '';
  testLastCode = '';
  private testTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private barcodeService: BarcodeService) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.isLoading = true;
    this.barcodeService.getScannerConfig().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.data?.config) {
          this.config = { ...res.data.config };
        }
      },
      error: () => {
        this.isLoading = false;
        // Usar config por defecto si no hay backend
      }
    });
  }

  save(): void {
    this.isSaving = true;
    this.saveSuccess = false;
    this.errorMessage = '';

    this.barcodeService.saveScannerConfig(this.config).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveSuccess = true;
        setTimeout(() => { this.saveSuccess = false; }, 3000);
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'No se pudo guardar la configuración. Intente de nuevo.';
      }
    });
  }

  restore(): void {
    this.config = { ...DEFAULT_SCANNER_CONFIG };
  }

  toggleTestMode(): void {
    this.testMode = !this.testMode;
    this.testLastCode = '';
    this.testBuffer = '';
  }

  onTestKeydown(event: KeyboardEvent): void {
    if (!this.testMode) return;
    if (event.key === 'Enter') {
      if (this.testBuffer.length > 2) {
        this.testLastCode = this.testBuffer;
        this.playTestBeep();
      }
      this.testBuffer = '';
      return;
    }
    if (event.key.length === 1) this.testBuffer += event.key;
    if (this.testTimer) clearTimeout(this.testTimer);
    this.testTimer = setTimeout(() => { this.testBuffer = ''; }, 100);
  }

  private playTestBeep(): void {
    if (!this.config.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880; osc.type = 'sine';
      const vol = this.config.soundVolume / 100 * 0.5;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch { /* sin audio */ }
  }

  get showCameraSection(): boolean {
    return this.config.deviceType === 'camera' || this.config.deviceType === 'both';
  }
}
