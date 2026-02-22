import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { Router } from '@angular/router';

import { ConfigService } from './config.service';
import { HttpService } from './http.service';
import { StorageService } from './storage.service';
import { ApiResponse } from '../models/api-response.model';
import { API_CONSTANTS } from '../constants/api.constants';
import {
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    ChangePasswordRequest,
    VerifyPermissionRequest,
    VerifyPermissionResponse,
    User,
    UserPermissions,
    UserProfile
} from '../models/auth.model';

/**
 * Servicio de Autenticación
 * Sprint 2 - Autenticación y Autorización
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {

    // Subjects para observables
    private isAuthenticatedSubject!: BehaviorSubject<boolean>;
    private currentUserSubject!: BehaviorSubject<User | null>;
    private permissionsSubject!: BehaviorSubject<UserPermissions | null>;

    // Observables públicos
    public isAuthenticated$!: Observable<boolean>;
    public currentUser$!: Observable<User | null>;
    public permissions$!: Observable<UserPermissions | null>;

    constructor(
        private http: HttpService,
        private storage: StorageService,
        private router: Router,
        private config: ConfigService
    ) {
        // Inicializar subjects DESPUÉS de que storage esté disponible
        this.initializeSubjects();
    }

    /**
     * Inicializar subjects con valores del storage
     */
    private initializeSubjects(): void {
        this.isAuthenticatedSubject = new BehaviorSubject<boolean>(this.storage.isAuthenticated());
        this.currentUserSubject = new BehaviorSubject<User | null>(this.storage.getUser());
        this.permissionsSubject = new BehaviorSubject<UserPermissions | null>(this.storage.getPermissions());

        // Exponer como observables
        this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
        this.currentUser$ = this.currentUserSubject.asObservable();
        this.permissions$ = this.permissionsSubject.asObservable();
    }

    /**
     * Iniciar sesión
     */
    login(credentials: LoginRequest, rememberMe: boolean = false): Observable<ApiResponse<LoginResponse>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.AUTH_LOGIN);

        return this.http.post<LoginResponse>(url, credentials)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.storage.saveTokens(response.data.tokens, rememberMe);
                        this.storage.saveUser(response.data.user);
                        this.storage.savePermissions(response.data.permissions);

                        this.isAuthenticatedSubject.next(true);
                        this.currentUserSubject.next(response.data.user);
                        this.permissionsSubject.next(response.data.permissions);
                    }
                })
            );
    }

    /**
     * Cerrar sesión
     */
    logout(): Observable<ApiResponse<any>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.AUTH_LOGOUT);
        const refreshToken = this.storage.getRefreshToken();

        return this.http.post<any>(url, { refreshToken })
            .pipe(
                tap(() => {
                    this.clearSession();
                })
            );
    }

    /**
     * Cerrar sesión local
     */
    logoutLocal(): void {
        this.clearSession();
    }

    /**
     * Limpiar sesión
     */
    private clearSession(): void {
        this.storage.clear();
        this.isAuthenticatedSubject.next(false);
        this.currentUserSubject.next(null);
        this.permissionsSubject.next(null);
        this.router.navigate(['/login']);
    }

    /**
     * Refrescar token
     */
    refreshToken(): Observable<ApiResponse<RefreshTokenResponse>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.AUTH_REFRESH);
        const refreshToken = this.storage.getRefreshToken();

        if (!refreshToken) {
            throw new Error('No refresh token available');
        }

        return this.http.post<RefreshTokenResponse>(url, { refreshToken })
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.storage.saveTokens({
                            accessToken: response.data.accessToken,
                            refreshToken: response.data.refreshToken,
                            expiresIn: response.data.expiresIn
                        });
                    }
                })
            );
    }

    /**
     * Obtener perfil del usuario
     */
    getProfile(): Observable<ApiResponse<UserProfile>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.AUTH_PROFILE);

        return this.http.get<UserProfile>(url)
            .pipe(
                tap(response => {
                    if (response.success && response.data) {
                        this.storage.saveUser({
                            id: response.data.id,
                            username: response.data.username,
                            email: response.data.email,
                            firstName: response.data.firstName,
                            lastName: response.data.lastName,
                            fullName: response.data.fullName,
                            role: response.data.role
                        });

                        this.storage.savePermissions(response.data.permissions);

                        this.currentUserSubject.next({
                            id: response.data.id,
                            username: response.data.username,
                            email: response.data.email,
                            firstName: response.data.firstName,
                            lastName: response.data.lastName,
                            fullName: response.data.fullName,
                            role: response.data.role
                        });

                        this.permissionsSubject.next(response.data.permissions);
                    }
                })
            );
    }

    /**
     * Verificar permiso específico
     */
    verifyPermission(module: string, action: string): Observable<ApiResponse<VerifyPermissionResponse>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.AUTH_VERIFY_PERMISSION);
        return this.http.post<VerifyPermissionResponse>(url, { module, action });
    }

    /**
     * Cambiar contraseña
     */
    changePassword(passwords: ChangePasswordRequest): Observable<ApiResponse<any>> {
        const url = this.config.getEndpointUrl(API_CONSTANTS.ENDPOINTS.AUTH_CHANGE_PASSWORD);
        return this.http.post<any>(url, passwords);
    }

    /**
     * Verificar si el usuario está autenticado
     */
    isAuthenticated(): boolean {
        return this.storage.isAuthenticated();
    }

    /**
     * Obtener usuario actual
     */
    getCurrentUser(): User | null {
        return this.storage.getUser();
    }

    /**
     * Obtener permisos actuales
     */
    getPermissions(): UserPermissions | null {
        return this.storage.getPermissions();
    }

    /**
     * Verificar si tiene un permiso específico
     */
    hasPermission(module: string, action: string): boolean {
        const permissions = this.storage.getPermissions();

        if (!permissions) {
            return false;
        }

        if (permissions.isAdmin) {
            return true;
        }

        if (permissions.permissions[module]) {
            return permissions.permissions[module].includes(action);
        }

        return false;
    }

    /**
     * Verificar si tiene acceso a un módulo
     */
    hasModuleAccess(module: string): boolean {
        const permissions = this.storage.getPermissions();

        if (!permissions) {
            return false;
        }

        if (permissions.isAdmin) {
            return true;
        }

        return permissions.modules.includes(module);
    }

    /**
     * Verificar si es administrador
     */
    isAdmin(): boolean {
        const permissions = this.storage.getPermissions();
        return permissions?.isAdmin || false;
    }
}
