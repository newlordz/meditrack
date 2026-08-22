/**
 * api.js — Centralized API client for MEDITRACK
 * All requests proxy through Vite to localhost:5000 (backend)
 */

const BASE = '/api';

async function request(path) {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) {
        let msg = res.statusText;
        try { const data = await res.json(); if (data.error) msg = data.error; } catch { /* ignore */ }
        throw new Error(msg);
    }
    return res.json();
}

async function patch(path, body = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        let msg = res.statusText;
        try { const data = await res.json(); if (data.error) msg = data.error; } catch { /* ignore */ }
        throw new Error(msg);
    }
    return res.json();
}

async function del(path) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
        let msg = res.statusText;
        try { const data = await res.json(); if (data.error) msg = data.error; } catch { /* ignore */ }
        throw new Error(msg);
    }
    return res.json();
}

async function post(path, body = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        let msg = res.statusText;
        try { const data = await res.json(); if (data.error) msg = data.error; } catch { /* ignore */ }
        throw new Error(msg);
    }
    return res.json();
}

// ─── Patients ────────────────────────────────────────────────────────────────
export const getPatients = (doctorId) => request(doctorId ? `/patients?doctorId=${doctorId}` : '/patients');
export const getPatient = (id) => request(`/patients/${id}`);
export const deletePatient = (id) => del(`/patients/${id}`);
export const updatePatient = (id, data) => patch(`/patients/${id}`, data);

// --- Password Reset Requests ---
export const submitPasswordResetRequest = (data) => post('/auth/reset-request', data);
export const getPasswordResetRequests = () => request('/auth/reset-requests');
export const updatePasswordResetRequest = (id, data) => patch(`/auth/reset-requests/${id}`, data);

// ─── Escalations ─────────────────────────────────────────────────────────────
export const getEscalations = (doctorId) => request(doctorId ? `/escalations?doctorId=${doctorId}` : '/escalations');
export const createEscalation = (data) => post('/escalations', data);
export const resolveEscalation = (id) => patch(`/escalations/${id}/resolve`);
export const dismissEscalation = (id) => patch(`/escalations/${id}/dismiss`);

// ─── Prescriptions ───────────────────────────────────────────────────────────
export const getPrescriptions = (patientId) => request(`/prescriptions?patientId=${patientId}`);
export const createPrescription = (data) => post('/prescriptions', data);

// ─── Refill Requests ─────────────────────────────────────────────────────────
export const getRefillRequests = (doctorId) => request(doctorId ? `/refills?doctorId=${doctorId}` : '/refills');
export const requestRefill = (data) => post('/refills', data);
export const updateRefillStatus = (id, status) => patch(`/refills/${id}`, { status });

// ─── Medication Logs ─────────────────────────────────────────────────────────
export const getMedicationLogs = () => request('/logs');
export const recordMedicationLog = (data) => post('/logs', data);

// ─── Users & Auth ────────────────────────────────────────────────────────────
export const loginUser = (email, password) => post('/auth/login', { email, password });
export const verifyMfa = (userId, code) => post('/auth/verify-mfa', { userId, code });
export const enableMfa = (userId) => post('/auth/enable-mfa', { userId });
export const confirmMfa = (userId, secret, code) => post('/auth/confirm-mfa', { userId, secret, code });
export const disableMfa = (userId) => post('/auth/disable-mfa', { userId });
export const getUsers = () => request('/users');
export const createUser = (data) => post('/users', data);
export const deleteUser = (id) => del(`/users/${id}`);
export const resetUserPassword = (id, newPassword) => patch(`/users/${id}/reset`, { newPassword });
export const changeMyPassword = (id, oldPassword, newPassword) => patch(`/users/${id}/change-password`, { oldPassword, newPassword });

// ─── Admin Log Clearing ──────────────────────────────────────────────────────
export const clearSystemLogs = () => post('/admin/clear-logs');

// ─── Medicine Picture Verification API ───────────────────────────────────────
export const verifyMedicinePicture = (data) => post('/verify/pill', data);
