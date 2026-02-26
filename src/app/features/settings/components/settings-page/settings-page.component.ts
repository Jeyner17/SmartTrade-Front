import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { AlertService } from '../../../../core/services/alert.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

import {
  SystemConfiguration
} from '../../models/settings.model';
import { COUNTRIES, CURRENCIES, TAX_REGIMES, BACKUP_FREQUENCIES, DATE_FORMATS, TIME_FORMATS } from '../../../../core/constants/app.constants';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LoaderComponent],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css'
})
export class SettingsPageComponent implements OnInit {
  // Estados de carga y edición
  isLoading = false;
  isSaving = false;
  isEditing = false;

  // Formularios
  companyForm!: FormGroup;
  fiscalForm!: FormGroup;
  businessForm!: FormGroup;
  technicalForm!: FormGroup;
  backupForm!: FormGroup;

  // Logo
  currentLogo: string | null | undefined = null;
  selectedFile: File | null = null;
  logoPreview: string | null = null;

  // Datos para selects
  countries = Object.entries(COUNTRIES).map(([code, name]) => ({ code, name }));
  currencies = Object.entries(CURRENCIES).map(([code, info]) => ({
    code: code,
    symbol: info.symbol,
    name: info.name
  }));
  taxRegimes = Array.from(TAX_REGIMES);
  backupFrequencies = [
    { value: 'daily',   label: 'Diario'   },
    { value: 'weekly',  label: 'Semanal'  },
    { value: 'monthly', label: 'Mensual'  }
  ];
  dateFormats = Object.keys(DATE_FORMATS);
  timeFormats = Array.from(Object.values(TIME_FORMATS));

  // Snapshot para revertir en Cancelar
  private configSnapshot: any = null;

  constructor(
    private fb: FormBuilder,
    private settingsService: SettingsService,
    private alertService: AlertService,
    private confirmationService: ConfirmationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadConfiguration();
  }

  // ============================================================
  // INICIALIZACIÓN
  // ============================================================

  private initializeForms(): void {
    this.companyForm = this.fb.group({
      name:    ['', [Validators.required, Validators.minLength(3)]],
      ruc:     ['', [Validators.required, Validators.minLength(10), Validators.maxLength(13)]],
      address: ['', [Validators.required]],
      phone:   ['', [Validators.required, Validators.minLength(7)]],
      email:   ['', [Validators.required, Validators.email]]
    });

    this.fiscalForm = this.fb.group({
      country:       ['EC',              Validators.required],
      currency:      ['USD',             Validators.required],
      taxRegime:     ['Régimen General', Validators.required],
      ivaPercentage: [15,                [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.businessForm = this.fb.group({
      minStock:               [10, [Validators.required, Validators.min(0)]],
      defaultCreditDays:      [30, [Validators.required, Validators.min(0)]],
      maxDiscountPercentage:  [20, [Validators.required, Validators.min(0), Validators.max(100)]]
    });

    this.technicalForm = this.fb.group({
      sessionTimeoutMinutes: [120,         [Validators.required, Validators.min(15)]],
      logRetentionDays:      [90,          [Validators.required, Validators.min(7)]],
      dateFormat:            ['DD/MM/YYYY', Validators.required],
      timeFormat:            ['24h',        Validators.required]
    });

    this.backupForm = this.fb.group({
      enabled:   [true,    Validators.required],
      frequency: ['daily', Validators.required],
      time:      ['02:00', [Validators.required, Validators.pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)]]
    });
  }

  // ============================================================
  // CARGA DE DATOS
  // ============================================================

  loadConfiguration(): void {
    this.isLoading = true;

    this.settingsService.getAllConfiguration().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.populateForms(response.data);
          this.saveSnapshot();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar configuración:', error);
        this.alertService.error('Error al cargar la configuración');
        this.isLoading = false;
      }
    });
  }

  private populateForms(config: SystemConfiguration): void {
    if (config.company) {
      this.companyForm.patchValue(config.company);
      this.currentLogo = config.company.logo;
    }
    if (config.fiscal)    this.fiscalForm.patchValue(config.fiscal);
    if (config.business)  this.businessForm.patchValue(config.business);
    if (config.technical) this.technicalForm.patchValue(config.technical);
    if (config.backup)    this.backupForm.patchValue(config.backup);
  }

  private saveSnapshot(): void {
    this.configSnapshot = {
      company:   { ...this.companyForm.value },
      fiscal:    { ...this.fiscalForm.value },
      business:  { ...this.businessForm.value },
      technical: { ...this.technicalForm.value },
      backup:    { ...this.backupForm.value }
    };
  }

  // ============================================================
  // CONTROL DE MODO EDICIÓN
  // ============================================================

  startEditing(): void {
    this.saveSnapshot();
    this.isEditing = true;
  }

  cancelEditing(): void {
    if (this.configSnapshot) {
      this.companyForm.patchValue(this.configSnapshot.company);
      this.fiscalForm.patchValue(this.configSnapshot.fiscal);
      this.businessForm.patchValue(this.configSnapshot.business);
      this.technicalForm.patchValue(this.configSnapshot.technical);
      this.backupForm.patchValue(this.configSnapshot.backup);
      this.companyForm.markAsUntouched();
      this.fiscalForm.markAsUntouched();
      this.businessForm.markAsUntouched();
      this.technicalForm.markAsUntouched();
      this.backupForm.markAsUntouched();
    }
    this.selectedFile = null;
    this.logoPreview = null;
    this.isEditing = false;
  }

  // ============================================================
  // GUARDADO
  // ============================================================

  saveAllConfiguration(): void {
    if (!this.validateAllForms()) {
      this.alertService.error('Por favor corrija los errores en el formulario');
      return;
    }

    this.isSaving = true;

    const configData = {
      company:   this.companyForm.value,
      fiscal:    this.fiscalForm.value,
      business:  this.businessForm.value,
      technical: this.technicalForm.value
    };

    this.settingsService.updateConfiguration(configData).subscribe({
      next: (response) => {
        if (response.success) {
          this.saveSnapshot();
          this.isEditing = false;
          this.alertService.success('Configuración guardada exitosamente');
          if (this.selectedFile) this.uploadLogo();
        }
        this.isSaving = false;
      },
      error: (error) => {
        this.isSaving = false;
        const errors = error?.error?.errors;
        if (errors?.length) {
          const message = errors
            .map((err: any) => `${err.field || 'Campo'}: ${err.message}`)
            .join('\n');
          this.alertService.error(`Errores de validación:\n${message}`);
        } else {
          this.alertService.error('Error al guardar la configuración');
        }
      }
    });
  }

  saveBackupConfiguration(): void {
    if (!this.backupForm.valid) {
      this.backupForm.markAllAsTouched();
      this.alertService.error('Por favor corrija los errores en la configuración de backup');
      return;
    }

    this.settingsService.configureBackups(this.backupForm.value).subscribe({
      next: (response) => {
        if (response.success) {
          this.alertService.success('Configuración de backups guardada exitosamente');
        }
      },
      error: (error) => {
        console.error('Error al configurar backups:', error);
        this.alertService.error('Error al configurar backups');
      }
    });
  }

  private validateAllForms(): boolean {
    this.companyForm.markAllAsTouched();
    this.fiscalForm.markAllAsTouched();
    this.businessForm.markAllAsTouched();
    this.technicalForm.markAllAsTouched();
    this.backupForm.markAllAsTouched();

    return this.companyForm.valid &&
           this.fiscalForm.valid &&
           this.businessForm.valid &&
           this.technicalForm.valid &&
           this.backupForm.valid;
  }

  // ============================================================
  // LOGO
  // ============================================================

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.alertService.error('Formato de imagen no válido. Use JPG o PNG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.alertService.error('El archivo es demasiado grande. Máximo 2MB');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => { this.logoPreview = e.target.result; };
    reader.readAsDataURL(file);
  }

  uploadLogo(): void {
    if (!this.selectedFile) return;

    this.settingsService.uploadLogo(this.selectedFile).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.currentLogo = response.data.logoUrl;
          this.logoPreview = null;
          this.selectedFile = null;
          this.alertService.success('Logo actualizado exitosamente');
        }
      },
      error: (error) => {
        console.error('Error al subir logo:', error);
        this.alertService.error('Error al subir el logo');
      }
    });
  }

  cancelLogoSelection(): void {
    this.selectedFile = null;
    this.logoPreview = null;
  }

  // ============================================================
  // HELPERS DE VISUALIZACIÓN (modo lectura)
  // ============================================================

  getCountryName(code: string): string {
    return (COUNTRIES as any)[code] ?? code;
  }

  getCurrencyDisplay(code: string): string {
    const c = (CURRENCIES as any)[code];
    return c ? `${c.name} (${c.symbol})` : code;
  }

  getFrequencyLabel(value: string): string {
    return this.backupFrequencies.find(f => f.value === value)?.label ?? value;
  }

  // ============================================================
  // HELPERS DE FORMULARIO
  // ============================================================

  getControl(form: FormGroup, fieldName: string): FormControl {
    return form.get(fieldName) as FormControl;
  }

  hasError(form: FormGroup, field: string, error: string): boolean {
    const control = form.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  getErrorMessage(form: FormGroup, field: string): string {
    const control = form.get(field);
    if (!control || !control.errors || !control.touched) return '';

    if (control.hasError('required'))  return 'Este campo es requerido';
    if (control.hasError('email'))     return 'Email inválido';
    if (control.hasError('pattern'))   return 'Formato inválido';

    if (control.hasError('minlength'))
      return `Mínimo ${control.errors['minlength'].requiredLength} caracteres`;
    if (control.hasError('maxlength'))
      return `Máximo ${control.errors['maxlength'].requiredLength} caracteres`;
    if (control.hasError('min'))
      return `Valor mínimo: ${control.errors['min'].min}`;
    if (control.hasError('max'))
      return `Valor máximo: ${control.errors['max'].max}`;

    return 'Campo inválido';
  }

  isFieldValid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.valid && control.touched);
  }

  isFieldInvalid(form: FormGroup, field: string): boolean {
    const control = form.get(field);
    return !!(control && control.invalid && control.touched);
  }
}
