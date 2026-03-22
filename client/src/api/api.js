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

// ─── Escalations ─────────────────────────────────────────────────────────────
export const getEscalations = (doctorId) => request(doctorId ? `/escalations?doctorId=${doctorId}` : '/escalations');
export const resolveEscalation = (id) => patch(`/escalations/${id}/resolve`);
export const dismissEscalation = (id) => patch(`/escalations/${id}/dismiss`);

// ─── Prescriptions ───────────────────────────────────────────────────────────
export const getPrescriptions = (patientId) => request(`/prescriptions?patientId=${patientId}`);
export const createPrescription = (data) => post('/prescriptions', data);

// ─── Refill Requests ─────────────────────────────────────────────────────────
export const getRefillRequests = (doctorId) => request(doctorId ? `/refills?doctorId=${doctorId}` : '/refills');
export const updateRefillStatus = (id, status) => patch(`/refills/${id}`, { status });

// ─── Medication Logs ─────────────────────────────────────────────────────────
export const getMedicationLogs = () => request('/logs');

// ─── Users & Auth ────────────────────────────────────────────────────────────
export const loginUser = (email, password) => post('/auth/login', { email, password });
export const getUsers = () => request('/users');
export const createUser = (data) => post('/users', data);
export const deleteUser = (id) => request(`/users/${id}`, { method: 'DELETE' }).catch(() => fetch(`${BASE}/users/${id}`, { method: 'DELETE' }).then(res => res.json())); // Add minimal delete support
export const resetUserPassword = (id, newPassword) => patch(`/users/${id}/reset`, { newPassword });
export const changeMyPassword = (id, oldPassword, newPassword) => patch(`/users/${id}/change-password`, { oldPassword, newPassword });
