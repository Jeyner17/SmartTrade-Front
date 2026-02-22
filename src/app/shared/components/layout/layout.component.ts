import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { APP_CONSTANTS } from '../../../core/constants/app.constants';
import { AUTH_CONSTANTS } from '../../../core/constants/auth.constants';
import { User, UserPermissions } from '../../../core/models/auth.model';

/**
 * Interface para elementos del menú
 */
interface MenuItem {
  icon: string;
  label: string;
  route: string;
  module: string;
  badge?: string;
  children?: MenuItem[];
}

/**
 * Componente de Layout Principal
 * Sprint 1 - Configuración del Sistema
 * Actualizado Sprint 2 - Menú dinámico y logout
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent implements OnInit, OnDestroy {
  
  // Datos de la app
  currentYear = new Date().getFullYear();
  appName = APP_CONSTANTS.APP_NAME;
  appVersion = APP_CONSTANTS.VERSION;

  // Usuario actual
  currentUser: User | null = null;
  userPermissions: UserPermissions | null = null;

  // Menú
  menuItems: MenuItem[] = [];
  isSidebarCollapsed = false;

  // Control de subscripciones
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.subscribeToUserChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar datos del usuario actual
   */
  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.userPermissions = this.authService.getPermissions();
    this.buildMenu();
  }

  /**
   * Suscribirse a cambios del usuario
   */
  private subscribeToUserChanges(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.authService.permissions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(permissions => {
        this.userPermissions = permissions;
        this.buildMenu();
      });
  }

  /**
   * Construir menú según permisos del usuario
   */
  private buildMenu(): void {
    if (!this.userPermissions) {
      this.menuItems = [];
      return;
    }

    const { MODULES } = AUTH_CONSTANTS;

    // Definir todos los items del menú disponibles
    const allMenuItems: MenuItem[] = [
      {
        icon: 'bi-speedometer2',
        label: 'Dashboard',
        route: '/dashboard',
        module: MODULES.ANALYTICS
      },
      {
        icon: 'bi-gear',
        label: 'Configuración',
        route: '/settings',
        module: MODULES.SETTINGS
      },
      {
        icon: 'bi-people',
        label: 'Usuarios',
        route: '/users',
        module: MODULES.USERS
      },
      {
        icon: 'bi-person-badge',
        label: 'Empleados',
        route: '/employees',
        module: MODULES.EMPLOYEES
      },
      {
        icon: 'bi-tags',
        label: 'Categorías',
        route: '/categories',
        module: MODULES.CATEGORIES
      },
      {
        icon: 'bi-box-seam',
        label: 'Productos',
        route: '/products',
        module: MODULES.PRODUCTS
      },
      {
        icon: 'bi-boxes',
        label: 'Inventario',
        route: '/inventory',
        module: MODULES.INVENTORY
      },
      {
        icon: 'bi-truck',
        label: 'Proveedores',
        route: '/suppliers',
        module: MODULES.SUPPLIERS
      },
      {
        icon: 'bi-cart-plus',
        label: 'Compras',
        route: '/purchases',
        module: MODULES.PURCHASES
      },
      {
        icon: 'bi-clipboard-check',
        label: 'Recepción',
        route: '/reception',
        module: MODULES.RECEPTION
      },
      {
        icon: 'bi-upc-scan',
        label: 'Códigos de Barra',
        route: '/barcodes',
        module: MODULES.BARCODES
      },
      {
        icon: 'bi-calculator',
        label: 'Punto de Venta',
        route: '/pos',
        module: MODULES.POS
      },
      {
        icon: 'bi-cart-check',
        label: 'Ventas',
        route: '/sales',
        module: MODULES.SALES
      },
      {
        icon: 'bi-receipt',
        label: 'Facturación',
        route: '/invoicing',
        module: MODULES.INVOICING
      },
      {
        icon: 'bi-cash-coin',
        label: 'Caja',
        route: '/cash-register',
        module: MODULES.CASH_REGISTER
      },
      {
        icon: 'bi-credit-card',
        label: 'Créditos',
        route: '/credits',
        module: MODULES.CREDITS
      },
      {
        icon: 'bi-wallet2',
        label: 'Gastos',
        route: '/expenses',
        module: MODULES.EXPENSES
      },
      {
        icon: 'bi-graph-up',
        label: 'Finanzas',
        route: '/finance',
        module: MODULES.FINANCE
      },
      {
        icon: 'bi-shield-check',
        label: 'Auditoría',
        route: '/audit',
        module: MODULES.AUDIT
      },
      {
        icon: 'bi-bell',
        label: 'Notificaciones',
        route: '/notifications',
        module: MODULES.NOTIFICATIONS
      },
      {
        icon: 'bi-file-earmark-bar-graph',
        label: 'Reportes',
        route: '/reports',
        module: MODULES.REPORTS
      }
    ];

    // Filtrar items según permisos del usuario
    this.menuItems = allMenuItems.filter(item => 
      this.hasModuleAccess(item.module)
    );
  }

  /**
   * Verificar si tiene acceso a un módulo
   */
  private hasModuleAccess(module: string): boolean {
    return this.authService.hasModuleAccess(module);
  }

  /**
   * Toggle sidebar
   */
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    if (confirm('¿Está seguro que desea cerrar sesión?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.alertService.success('Sesión cerrada exitosamente');
        },
        error: (error) => {
          console.error('Error al cerrar sesión:', error);
          // Cerrar sesión local de todas formas
          this.authService.logoutLocal();
        }
      });
    }
  }

  /**
   * Obtener iniciales del usuario
   */
  getUserInitials(): string {
    if (!this.currentUser) {
      return 'U';
    }

    const firstInitial = this.currentUser.firstName?.charAt(0) || '';
    const lastInitial = this.currentUser.lastName?.charAt(0) || '';
    
    return (firstInitial + lastInitial).toUpperCase() || 'U';
  }

  /**
   * Obtener nombre completo del usuario
   */
  getUserFullName(): string {
    return this.currentUser?.fullName || 'Usuario';
  }

  /**
   * Obtener rol del usuario
   */
  getUserRole(): string {
    return this.currentUser?.role.name || 'Sin rol';
  }

  /**
   * Verificar si es administrador
   */
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}