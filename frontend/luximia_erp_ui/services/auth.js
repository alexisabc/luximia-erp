import apiClient from './core';

// ===================== Autenticación / Enrolamiento =====================
export const validateEnrollmentToken = (token) =>
    apiClient.post('/users/enrollment/validate/', { token });

export const getPasskeyRegisterChallenge = () =>
    apiClient.get('/users/enrollment/passkey-challenge/');

export const verifyPasskeyRegistration = (registrationResponse) =>
    apiClient.post('/users/enrollment/passkey-register/', registrationResponse);

export const setupTotp = () => apiClient.post('/users/enrollment/totp-setup/');

export const verifyTotp = (code) =>
    apiClient.post('/users/enrollment/totp-verify/', { code });
