import { ref, nextTick, watch } from 'vue';
import { getSession, saveSession } from '../utils/api';
import { locale } from '../utils/i18n';

const formatTime = (dateObj = new Date()) => {
  const pad = (n, len=2) => String(n).padStart(len, '0');
  const yyyy = dateObj.getFullYear();
  const MM = pad(dateObj.getMonth() + 1);
  const dd = pad(dateObj.getDate());
  const HH = pad(dateObj.getHours());
  const mm = pad(dateObj.getMinutes());
  const ss = pad(dateObj.getSeconds());
  const SSS = pad(dateObj.getMilliseconds(), 3);
  return `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}.${SSS}`;
};

export function useChat(currentSessionId, currentTitle, configForm, fetchSessions) {
  const messages = ref([]);
  const inputForm = ref('');
  const editingIndex = ref(null);
  const activeStreams = ref({});
  const autoScrollEnabled = ref(true);
  const isSending = ref(false);

  // Persistence logic
  const getDraftKey = (id) => {
    if (!id || id === '___NEW_CHAT___') return 'chat_draft_new';
    return `chat_draft_${id}`;
  };

  watch(inputForm, (newVal) => {
    const key = getDraftKey(currentSessionId.value);
    if (key) {
      if (newVal) localStorage.setItem(key, newVal);
      else localStorage.removeItem(key);
    }
  });

  watch(currentSessionId, (newId, oldId) => {
    if (isSending.value) return; // Don't clear/load while sending

    // Clear messages if entering new chat
    if (!newId || newId === '___NEW_CHAT___') {
      messages.value = [];
    }

    const key = getDraftKey(newId);
    const saved = localStorage.getItem(key);
    inputForm.value = saved || '';
  }, { immediate: true });

  const buildApiPayload = (messagesArray, isStream) => {
    let parsedExtraParams = {};
    if (configForm.value.extra_params && configForm.value.extra_params.trim() !== '') {
      try { parsedExtraParams = JSON.parse(configForm.value.extra_params); } catch(e){ console.error("Failed to parse extra_params", e); }
    }
    return {
      base_url: configForm.value.base_url,
      model_name: configForm.value.model_name,
      api_key: configForm.value.api_key,
      system_prompt: configForm.value.system_prompt,
      extra_params: parsedExtraParams,
      messages: messagesArray,
      stream: isStream
    };
  };

  const saveCurrentSession = async () => {
    if (!currentSessionId.value) {
      currentSessionId.value = Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    }
    // Filter UI-only state
    const msgsToSave = messages.value.map(({ isCollapsed, ...rest }) => rest);
    await saveSession(currentSessionId.value, {
      title: currentTitle.value,
      config_name: configForm.value.name,
      messages: msgsToSave
    });
    if (fetchSessions) await fetchSessions();
  };

  const appendMessageToSession = async (sessionId, msg) => {
    if (currentSessionId.value === sessionId) {
      messages.value.push(msg);
      await saveCurrentSession();
    } else {
      try {
        const data = await getSession(sessionId);
        if (data && data.messages) {
          data.messages.push(msg);
          const msgsToSave = data.messages.map(({ isCollapsed, ...rest }) => rest);
          await saveSession(sessionId, { title: data.title, config_name: data.config_name, messages: msgsToSave });
        }
      } catch (e) {
        console.error("Failed to append background message", e);
      }
    }
  };

  const autoRenameSession = async (firstMessage, renameSessionId) => {
    if (!configForm.value.base_url) return;
    try {
      const msgs = [
        { role: 'system', content: 'You are a helpful assistant. Summarize the user\'s text into a short 2-4 word title. Do not output anything else but the title.' },
        { role: 'user', content: firstMessage }
      ];
      const payload = buildApiPayload(msgs, false);
      payload.system_prompt = msgs[0].content;
      if (payload.messages[0].role === 'system') {
        payload.messages[0].content = payload.system_prompt;
      }

      const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.choices && json.choices[0]) {
        const newTitle = json.choices[0].message.content.trim().replace(/^['"]|['"]$/g, '');
        if (currentSessionId.value === renameSessionId) {
           currentTitle.value = newTitle;
           await saveCurrentSession();
        } else {
           const data = await getSession(renameSessionId);
           if (data) {
             data.title = newTitle;
             await saveSession(renameSessionId, data);
             if (fetchSessions) await fetchSessions();
           }
        }
      }
    } catch (e) {
      console.error("Auto rename failed", e);
    }
  };

  const editMessage = (index, content, chatInputRef) => {
    if (Array.isArray(content)) {
      let text = '';
      const images = [];
      content.forEach(part => {
        if (part.type === 'text') text += part.text;
        else if (part.type === 'image_url') {
          images.push({ url: part.image_url.url, name: 'image.png' });
        }
      });
      inputForm.value = text;
      chatInputRef.value?.setAttachments(images);
    } else {
      inputForm.value = content;
      chatInputRef.value?.clearAttachments();
    }
    editingIndex.value = index;
    chatInputRef.value?.focus();
    nextTick(() => chatInputRef.value?.autoResize());
  };

  const cancelEdit = (chatInputRef) => {
    if (editingIndex.value !== null) {
      inputForm.value = '';
      editingIndex.value = null;
      chatInputRef.value?.clearAttachments();
      nextTick(() => chatInputRef.value?.autoResize());
    }
  };

  const doSend = async (useStream, scrollToBottom) => {
    const sessionId = currentSessionId.value;
    if (!activeStreams.value[sessionId]) {
      activeStreams.value[sessionId] = {
        isGenerating: false,
        currentResponse: '',
        currentReasoning: '',
        isCurrentReasoningCollapsed: false,
        currentResponseTime: '',
        currentMeta: null,
        abortController: null
      };
    }

    const streamState = activeStreams.value[sessionId];
    streamState.isGenerating = true;
    streamState.currentResponse = '';
    streamState.currentReasoning = '';
    streamState.isCurrentReasoningCollapsed = false;
    streamState.currentResponseTime = formatTime();
    streamState.currentMeta = null;
    streamState.abortController = new AbortController();

    const msgs = messages.value.map(m => ({ role: m.role, content: m.content }));
    const payload = buildApiPayload(msgs, useStream);

    const startTime = performance.now();
    let firstTokenTime = null;
    let lastMetaUpdateTime = 0;

    try {
      if (!useStream) {
        const res = await fetch('/api/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: streamState.abortController.signal
        });
        const data = await res.json();
        const endTime = performance.now();
        const ttftSec = (endTime - startTime) / 1000;
        if (data.error) throw new Error(data.error);
        const output = data.choices[0].message.content || '';
        const outputReasoning = data.choices[0].message.reasoning_content || data.choices[0].message.reasoning || '';

        let meta = null;
        if (data.usage?.total_time) {
          const genTokens = data.usage.completion_tokens || 0;
          meta = {
            ttft: ttftSec,
            total_time: data.usage.total_time,
            total_chars: output.length + outputReasoning.length,
            speed_chars: (output.length + outputReasoning.length) / data.usage.total_time,
            total_tokens: genTokens !== 0 ? genTokens : null,
            speed_tokens: genTokens ? (genTokens / data.usage.total_time) : null
          };
        } else {
          meta = {
            ttft: ttftSec,
            total_time: ttftSec,
            total_chars: output.length + outputReasoning.length,
            speed_chars: ttftSec > 0 ? (output.length + outputReasoning.length) / ttftSec : 0
          };
        }

        await appendMessageToSession(sessionId, { role: 'assistant', content: output, reasoning_content: outputReasoning, isCollapsed: outputReasoning ? true : false, meta, time: streamState.currentResponseTime });
        streamState.isGenerating = false;
        if (currentSessionId.value === sessionId && scrollToBottom) scrollToBottom();
      } else {
        const res = await fetch('/api/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: streamState.abortController.signal
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");

        let responseBuffer = '';
        let reasoningBuffer = '';
        let ssePendingBuffer = '';
        let lastRenderTime = performance.now();
        let hasUnrenderedContent = false;
        const UPDATE_INTERVAL_MS = 100;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          ssePendingBuffer += decoder.decode(value, { stream: true });
          const lines = ssePendingBuffer.split('\n');
          ssePendingBuffer = lines.pop() || '';
          for (let line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              if (dataStr.startsWith('[TELEMETRY] ')) {
                 const finalMeta = JSON.parse(dataStr.slice(12));
                 const f_ttft = streamState.currentMeta ? streamState.currentMeta.ttft : (finalMeta.total_time || 0);
                 streamState.currentMeta = {
                   ...finalMeta,
                   ttft: f_ttft,
                   total_time: finalMeta.total_time,
                   total_chars: responseBuffer.length + reasoningBuffer.length,
                   speed_chars: finalMeta.total_time > 0 ? (responseBuffer.length + reasoningBuffer.length) / finalMeta.total_time : 0,
                   total_tokens: finalMeta.total_tokens !== undefined ? finalMeta.total_tokens : null,
                   speed_tokens: finalMeta.total_tokens && finalMeta.total_time > 0 ? (finalMeta.total_tokens / finalMeta.total_time) : null
                 };
                 continue;
              }
              try {
                const data = JSON.parse(dataStr);
                if (data.error) {
                  responseBuffer += "\n\n**Error:** " + data.error;
                  hasUnrenderedContent = true;
                  continue;
                }
                const deltaReasoning = data.choices[0].delta.reasoning_content || data.choices[0].delta.reasoning || '';
                const delta = data.choices[0].delta.content || '';

                if (deltaReasoning || delta) {
                  if (!firstTokenTime) {
                    firstTokenTime = performance.now();
                    streamState.currentMeta = {
                      ttft: (firstTokenTime - startTime) / 1000,
                      total_time: null,
                      total_chars: 0,
                      speed_chars: 0,
                      total_tokens: null,
                      speed_tokens: null
                    };
                  }
                }

                if (deltaReasoning) {
                  reasoningBuffer += deltaReasoning;
                  hasUnrenderedContent = true;
                }
                if (delta) {
                  if (reasoningBuffer && !streamState.isCurrentReasoningCollapsed) {
                    streamState.isCurrentReasoningCollapsed = true;
                  }
                  responseBuffer += delta;
                  hasUnrenderedContent = true;
                }

                const now = performance.now();
                if (hasUnrenderedContent && now - lastRenderTime > UPDATE_INTERVAL_MS) {
                  streamState.currentReasoning = reasoningBuffer;
                  streamState.currentResponse = responseBuffer;
                  lastRenderTime = now;
                  hasUnrenderedContent = false;
                  if (currentSessionId.value === sessionId && scrollToBottom) scrollToBottom();
                }

                if (firstTokenTime && now - lastMetaUpdateTime > 200) {
                  const totalChars = responseBuffer.length + reasoningBuffer.length;
                  const elapsedSec = (now - firstTokenTime) / 1000;
                  const totalElapsedSec = (now - startTime) / 1000;
                  if (streamState.currentMeta) {
                    streamState.currentMeta.total_time = totalElapsedSec;
                    streamState.currentMeta.total_chars = totalChars;
                    streamState.currentMeta.speed_chars = elapsedSec > 0 ? totalChars / elapsedSec : 0;
                  }
                  lastMetaUpdateTime = now;
                }
              } catch (e) {
                console.error("Failed to parse streaming chunk", e, dataStr);
              }
            }
          }
        }

        if (hasUnrenderedContent) {
          streamState.currentReasoning = reasoningBuffer;
          streamState.currentResponse = responseBuffer;
        }

        await appendMessageToSession(sessionId, { role: 'assistant', content: streamState.currentResponse, reasoning_content: streamState.currentReasoning, isCollapsed: streamState.isCurrentReasoningCollapsed, meta: streamState.currentMeta ? { ...streamState.currentMeta } : null, time: streamState.currentResponseTime });
        streamState.currentResponse = '';
        streamState.currentReasoning = '';
        streamState.isCurrentReasoningCollapsed = false;
        streamState.isGenerating = false;
        if (currentSessionId.value === sessionId && scrollToBottom) scrollToBottom();
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Generation aborted for session", sessionId);
      } else {
        await appendMessageToSession(sessionId, { role: 'assistant', content: `**Error:** ${err.message}`, time: streamState.currentResponseTime });
      }
      streamState.isGenerating = false;
      streamState.currentResponse = '';
    }
  };

  const sendMessage = async (attachments = [], useStream, chatInputRef, scrollToBottom) => {
    const activeSessionId = currentSessionId.value;
    const activeStreamState = activeStreams.value[activeSessionId];

    // Stop current generation first when user clicks the "Stop" button.
    if (activeStreamState && activeStreamState.isGenerating) {
      if (activeStreamState.abortController) activeStreamState.abortController.abort();
      activeStreamState.isGenerating = false;
      if (activeStreamState.currentResponse || activeStreamState.currentReasoning) {
        await appendMessageToSession(activeSessionId, {
          role: 'assistant',
          content: activeStreamState.currentResponse,
          reasoning_content: activeStreamState.currentReasoning,
          isCollapsed: activeStreamState.isCurrentReasoningCollapsed,
          meta: activeStreamState.currentMeta ? { ...activeStreamState.currentMeta } : null,
          time: activeStreamState.currentResponseTime
        });
      }
      activeStreamState.currentResponse = '';
      activeStreamState.currentReasoning = '';
      activeStreamState.isCurrentReasoningCollapsed = false;
      return;
    }

    const text = inputForm.value.trim();
    if (!text && attachments.length === 0) {
      return 'CONFIG_NEEDED';
    }

    if (!configForm.value.base_url) {
      return 'CONFIG_NEEDED';
    }

    isSending.value = true;
    let sendTask = null;
    try {
      await saveCurrentSession();

      const sessionId = currentSessionId.value;

      if (editingIndex.value !== null) {
        messages.value = messages.value.slice(0, editingIndex.value);
        editingIndex.value = null;
      }

      const nowTime = formatTime();
      
      let contentPayload = text;
      if (attachments.length > 0) {
        contentPayload = [];
        if (text) {
          contentPayload.push({ type: 'text', text: text });
        }
        for (const img of attachments) {
          contentPayload.push({ type: 'image_url', image_url: { url: img.url } });
        }
      }

      messages.value.push({ role: 'user', content: contentPayload, time: nowTime });
      inputForm.value = '';
      
      chatInputRef.value?.clearAttachments();
      nextTick(() => chatInputRef.value?.autoResize());
      if (scrollToBottom) scrollToBottom(true);
      await saveCurrentSession();
      // Clear draft after successful save
      localStorage.removeItem('chat_draft_new');
      const key = getDraftKey(sessionId);
      if (key) localStorage.removeItem(key);

      if (messages.value.length === 1) {
        if (currentTitle.value === '___NEW_CHAT___') {
          const initialTitle = text ? (text.slice(0, 30) + (text.length > 30 ? '...' : '')) : (locale.value === 'zh' ? '图片分析' : 'Image Analysis');
          currentTitle.value = initialTitle;
          await saveCurrentSession(); 
        }
        autoRenameSession(text || (locale.value === 'zh' ? '图片分析' : 'Image Analysis'), sessionId);
      }

      sendTask = doSend(useStream, scrollToBottom);
    } finally {
      isSending.value = false;
    }
    if (sendTask) {
      await sendTask;
    }
  };

  const regenerateLast = async (useStream, scrollToBottom) => {
    if (messages.value.length === 0) return;
    if (messages.value[messages.value.length-1].role === 'assistant') {
      messages.value.pop();
    }
    // Persist truncated history first to avoid restoring stale assistant message
    // when user switches sessions during regeneration.
    await saveCurrentSession();
    await doSend(useStream, scrollToBottom);
  };

  return {
    messages,
    inputForm,
    editingIndex,
    activeStreams,
    autoScrollEnabled,
    sendMessage,
    regenerateLast,
    editMessage,
    cancelEdit,
    saveCurrentSession,
    autoRenameSession
  };
}
