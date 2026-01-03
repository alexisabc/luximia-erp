import api from './api';

export const getDailyBriefing = () => {
    return api.get('/ia/daily-briefing/');
};

export const triggerAuditScan = () => {
    return api.post('/ia/audit-trigger/');
};
