const API_BASE = '/api';

export async function fetchProfile() {
  const res = await fetch(`${API_BASE}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function updateProfile(profileData) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) throw new Error('Failed to update profile');
  return res.json();
}

export async function sendChatMessage(message, overrideTime = null, conversationId = null) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      speaker: 'patient',
      override_time: overrideTime,
      conversation_id: conversationId
    })
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Chat error' }));
    throw new Error(errorData.detail || 'Failed to send message');
  }
  return res.json();
}

export async function fetchMemories(filterType = 'all', pendingOnly = false) {
  let url = `${API_BASE}/memories?filter_type=${filterType}`;
  if (pendingOnly) url += '&pending_only=true';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch memories');
  return res.json();
}

export async function createMemory(memoryData) {
  const res = await fetch(`${API_BASE}/memories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memoryData)
  });
  if (!res.ok) throw new Error('Failed to create memory');
  return res.json();
}

export async function verifyMemory(memId) {
  const res = await fetch(`${API_BASE}/memories/${memId}/verify`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to verify memory');
  return res.json();
}

export async function updateMemory(memId, memoryData) {
  const res = await fetch(`${API_BASE}/memories/${memId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(memoryData)
  });
  if (!res.ok) throw new Error('Failed to update memory');
  return res.json();
}

export async function fetchRoutines() {
  const res = await fetch(`${API_BASE}/routines`);
  if (!res.ok) throw new Error('Failed to fetch routines');
  return res.json();
}

export async function createRoutine(routineData) {
  const res = await fetch(`${API_BASE}/routines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(routineData)
  });
  if (!res.ok) throw new Error('Failed to create routine');
  return res.json();
}

export async function performRoutineAction(routineId, action) {
  const res = await fetch(`${API_BASE}/routines/${routineId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
  if (!res.ok) throw new Error('Failed to perform routine action');
  return res.json();
}

export async function fetchAlerts(unackOnly = false) {
  const res = await fetch(`${API_BASE}/alerts?unack_only=${unackOnly}`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function acknowledgeAlert(alertId, acknowledgedBy = 'Sarah Ellis (Caregiver)') {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acknowledged_by: acknowledgedBy })
  });
  if (!res.ok) throw new Error('Failed to acknowledge alert');
  return res.json();
}

export async function escalateAlert(alertId, contactId) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/escalate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_id: contactId })
  });
  if (!res.ok) throw new Error('Failed to escalate alert');
  return res.json();
}

export async function submitFamilyMemory(familyData) {
  const res = await fetch(`${API_BASE}/family/submit-memory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(familyData)
  });
  if (!res.ok) throw new Error('Failed to submit family memory');
  return res.json();
}

export async function fetchFamilyGuide() {
  const res = await fetch(`${API_BASE}/family/engagement-guide`);
  if (!res.ok) throw new Error('Failed to fetch engagement guide');
  return res.json();
}

export async function fetchTimeline() {
  const res = await fetch(`${API_BASE}/dashboard/timeline`);
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function fetchAuditLog(eventType = null) {
  let url = `${API_BASE}/audit-log`;
  if (eventType) url += `?event_type=${eventType}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch audit log');
  return res.json();
}
