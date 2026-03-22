import { ref } from 'vue';
import { fetchConfig } from '../utils/api';

export function useConfig() {
  const configForm = ref({
    base_url: '',
    model_name: '',
    api_key: '',
    system_prompt: '',
    extra_params: '{}'
  });

  const loadSettings = async () => {
    try {
      const cached = localStorage.getItem('llm_chat_config');
      if (cached) {
        configForm.value = JSON.parse(cached);
      } else {
        const backendConfig = await fetchConfig();
        configForm.value = {
          base_url: backendConfig.base_url || '',
          model_name: backendConfig.model_name || '',
          api_key: backendConfig.api_key || '',
          system_prompt: backendConfig.system_prompt || '',
          extra_params: backendConfig.extra_params ? JSON.stringify(backendConfig.extra_params, null, 2) : '{}'
        };
        localStorage.setItem('llm_chat_config', JSON.stringify(configForm.value));
      }
    } catch (err) {
      console.error("Failed to load default config", err);
    }
  };

  const resetConfigToDefault = async () => {
    try {
      localStorage.removeItem('llm_chat_config');
      const backendConfig = await fetchConfig();
      configForm.value = {
        base_url: backendConfig.base_url || '',
        model_name: backendConfig.model_name || '',
        api_key: backendConfig.api_key || '',
        system_prompt: backendConfig.system_prompt || '',
        extra_params: backendConfig.extra_params ? JSON.stringify(backendConfig.extra_params, null, 2) : '{}'
      };
      localStorage.setItem('llm_chat_config', JSON.stringify(configForm.value));
    } catch (err) {
      console.error("Failed to fetch backend configuration.");
    }
  };

  const updateConfig = (newConfig) => {
    configForm.value = { ...newConfig };
    localStorage.setItem('llm_chat_config', JSON.stringify(configForm.value));
  };

  return {
    configForm,
    loadSettings,
    resetConfigToDefault,
    updateConfig
  };
}
