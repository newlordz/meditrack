import { createContext } from 'react';

export const ROLES = {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    CAREGIVER: 'caregiver',
};

export const ROLE_ROUTES = {
    [ROLES.PATIENT]: '/patient/schedule',
    [ROLES.DOCTOR]: '/clinician/dashboard',
    [ROLES.PHARMACIST]: '/pharmacist/conflicts',
    [ROLES.CAREGIVER]: '/caregiver/dashboard',
};

export const AuthContext = createContext(null);
