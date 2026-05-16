import { AssessmentSession } from '@/types';
import { GuestData } from '@/types/guest.types';

const GUEST_DATA_KEY = 'guest_assessment_data';

export const guestStorage = {
    saveSession: (session: AssessmentSession) => {
        const currentData = guestStorage.getData();
        const existingIndex = currentData.sessions.findIndex(s => s.assessmentSessionId === session.assessmentSessionId);
        
        if (existingIndex >= 0) {
            currentData.sessions[existingIndex] = session;
        } else {
            currentData.sessions.push(session);
        }
        
        localStorage.setItem(GUEST_DATA_KEY, JSON.stringify(currentData));
    },

    getData: (): GuestData => {
        if (typeof window === 'undefined') return { sessions: [] };
        
        const data = localStorage.getItem(GUEST_DATA_KEY);
        try {
            return data ? JSON.parse(data) : { sessions: [] };
        } catch {
            return { sessions: [] };
        }
    },

    clearData: () => {
        localStorage.removeItem(GUEST_DATA_KEY);
    },

    hasData: (): boolean => {
        const data = guestStorage.getData();
        return data.sessions.length > 0;
    }
};
