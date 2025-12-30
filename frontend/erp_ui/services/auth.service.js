import apiClient from './core';

/**
 * Servicio de Autenticación y Seguridad (Sprint 11)
 * Maneja el flujo de login Passwordless (Passkeys/TOTP) y Enrolamiento.
 */
const authService = {
    // --- Flujo de Login ---

    /**
     * Paso 1: Inicia el login identificando al usuario y obteniendo métodos disponibles.
     */
    loginStart: (email) =>
        apiClient.post('/users/login/start/', { email }),

    /**
     * Paso 2a: Obtiene el challenge para autenticación con Passkey.
     */
    passkeyLoginChallenge: () =>
        apiClient.get('/users/passkey/login/challenge/'),

    /**
     * Paso 2b: Verifica la respuesta de la Passkey.
     */
    passkeyLoginVerify: (assertionResponse) =>
        apiClient.post('/users/passkey/login/', assertionResponse),

    /**
     * Paso 2c: Verifica el código TOTP para login.
     */
    totpLoginVerify: (code) =>
        apiClient.post('/users/totp/login/verify/', { code }),


    // --- Flujo de Enrolamiento (Activación de cuenta) ---

    /**
     * Valida el token recibido por correo.
     */
    validateEnrollmentToken: (token) =>
        apiClient.post('/users/enrollment/validate/', { token }),

    /**
     * Obtiene el challenge para registrar una nueva Passkey.
     */
    getPasskeyRegisterChallenge: () =>
        apiClient.get('/users/enrollment/passkey-challenge/'),

    /**
     * Verifica y guarda la nueva Passkey.
     */
    verifyPasskeyRegistration: (registrationResponse) =>
        apiClient.post('/users/enrollment/passkey-register/', registrationResponse),

    /**
     * Inicia la configuración de TOTP (devuelve URI para QR).
     */
    setupTotp: () =>
        apiClient.post('/users/enrollment/totp-setup/'),

    /**
     * Verifica el primer código TOTP para activar la cuenta.
     */
    verifyTotp: (code) =>
        apiClient.post('/users/enrollment/totp-verify/', { code }),


    // --- Gestión de Sesión ---

    /**
     * Refresca el access token usando el refresh token.
     */
    refreshToken: (refresh) =>
        apiClient.post('/users/token/refresh/', { refresh })
};

export default authService;
