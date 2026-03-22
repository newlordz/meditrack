import { createContext } from 'react';

export const ROLES = {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    CAREGIVER: 'caregiver',
    ADMIN: 'admin',
};

export const ROLE_ROUTES = {
    [ROLES.PATIENT]: '/patient/schedule',
    [ROLES.DOCTOR]: '/clinician/dashboard',
    [ROLES.PHARMACIST]: '/pharmacist/conflicts',
    [ROLES.CAREGIVER]: '/caregiver/dashboard',
    [ROLES.ADMIN]: '/admin/dashboard',
};

export const AuthContext = createContext(null);
