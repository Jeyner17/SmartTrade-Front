import { Routes } from '@angular/router';
import { authGuard, moduleGuard } from '../../core/guards';
import { AUTH_CONSTANTS } from '../../core/constants/auth.constants';

const { MODULES } = AUTH_CONSTANTS;

export const SUPPLIERS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/supplier-list/supplier-list.component')
            .then(m => m.SupplierListComponent),
        canActivate: [authGuard, moduleGuard],
        data: { module: MODULES.SUPPLIERS },
        title: 'Gestión de Proveedores'
    },
    {
        path: 'new',
        loadComponent: () => import('./components/supplier-form/supplier-form.component')
            .then(m => m.SupplierFormComponent),
        canActivate: [authGuard, moduleGuard],
        data: { module: MODULES.SUPPLIERS },
        title: 'Nuevo Proveedor'
    },
    {
        path: ':id/edit',
        loadComponent: () => import('./components/supplier-form/supplier-form.component')
            .then(m => m.SupplierFormComponent),
        canActivate: [authGuard, moduleGuard],
        data: { module: MODULES.SUPPLIERS },
        title: 'Editar Proveedor'
    },
    {
        path: ':id',
        loadComponent: () => import('./components/supplier-detail/supplier-detail.component')
            .then(m => m.SupplierDetailComponent),
        canActivate: [authGuard, moduleGuard],
        data: { module: MODULES.SUPPLIERS },
        title: 'Detalle de Proveedor'
    }
];
