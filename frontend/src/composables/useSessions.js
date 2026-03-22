import { ref, watch } from 'vue';
import { listSessions, getSession, deleteSession, clearAllSessions } from '../utils/api';
import { t } from '../utils/i18n';

export function useSessions() {
  const sessions = ref([]);
  const currentSessionId = ref(null);
  const currentTitle = ref('___NEW_CHAT___');

  watch(currentSessionId, (newId) => {
    if (newId) {
      localStorage.setItem('lastSessionId', newId);
    } else {
      localStorage.removeItem('lastSessionId');
    }
  });

  const fetchSessions = async () => {
    try {
      sessions.value = await listSessions();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteChatSession = async (id, onDeleted) => {
    if (confirm(t('confirmDelete'))) {
      await deleteSession(id);
      if (currentSessionId.value === id) {
        currentSessionId.value = null;
        currentTitle.value = '___NEW_CHAT___';
        if (onDeleted) onDeleted();
      }
      await fetchSessions();
    }
  };

  const clearAll = async (onCleared) => {
    if (confirm(t('confirmClearAll'))) {
      await clearAllSessions();
      currentSessionId.value = null;
      currentTitle.value = '___NEW_CHAT___';
      if (onCleared) onCleared();
      await fetchSessions();
    }
  };

  return {
    sessions,
    currentSessionId,
    currentTitle,
    fetchSessions,
    deleteChatSession,
    clearAll
  };
}
