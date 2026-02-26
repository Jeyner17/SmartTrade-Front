import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ConfirmationModalComponent } from '../../shared/components/confirmation-modal/confirmation-modal.component';

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {}

  confirm(config: ConfirmationConfig): Observable<boolean> {
    const subject = new Subject<boolean>();

    // Crear el componente modal dinámicamente
    const componentRef = createComponent(ConfirmationModalComponent, {
      environmentInjector: this.injector
    });

    // Pasar la configuración
    componentRef.instance.config = config;

    // Escuchar la respuesta del usuario
    componentRef.instance.result.subscribe((result: boolean) => {
      subject.next(result);
      subject.complete();

      // Limpiar el componente del DOM
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    });

    // Adjuntar al DOM
    this.appRef.attachView(componentRef.hostView);
    document.body.appendChild(componentRef.location.nativeElement);

    return subject.asObservable();
  }
}
