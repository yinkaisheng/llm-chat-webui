import { ref, watch } from 'vue';
import { fetchConfig } from '../utils/api';

export function useConfig() {
  const configList = ref([]);
  const currentIndex = ref(0);
  const configForm = ref({
    base_url: '',
    model_name: '',
    api_key: '',
    system_prompt: '',
    extra_params: '{}'
  });

  const loadSettings = async () => {
    try {
      const backendConfig = await fetchConfig();
      const serverConfig = {
        name: backendConfig.model_name || 'Server',
        base_url: backendConfig.base_url || '',
        model_name: backendConfig.model_name || '',
        api_key: backendConfig.api_key || '',
        system_prompt: backendConfig.system_prompt || '',
        extra_params: backendConfig.extra_params ? JSON.stringify(backendConfig.extra_params, null, 2) : '{}',
        isServer: true
      };

      const cached = localStorage.getItem('llm_chat_configs');
      let configs = [];
      if (cached) {
        configs = JSON.parse(cached);
        // Ensure the first one is always the latest server config
        configs[0] = serverConfig;
      } else {
        configs = [serverConfig];
      }
      
      configList.value = configs;
      
      const savedIndex = localStorage.getItem('llm_chat_config_index');
      currentIndex.value = savedIndex !== null ? parseInt(savedIndex) : 0;
      if (currentIndex.value >= configList.value.length) currentIndex.value = 0;
      
      configForm.value = { ...configList.value[currentIndex.value] };
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  const saveAllConfigs = () => {
    localStorage.setItem('llm_chat_configs', JSON.stringify(configList.value));
    localStorage.setItem('llm_chat_config_index', currentIndex.value.toString());
  };

  const selectConfig = (index) => {
    currentIndex.value = index;
    configForm.value = { ...configList.value[index] };
    localStorage.setItem('llm_chat_config_index', index.toString());
  };

  const updateConfig = (newConfig) => {
    if (currentIndex.value === 0) return; // Cannot update server config
    const name = configList.value[currentIndex.value].name;
    const isServer = configList.value[currentIndex.value].isServer;
    configList.value.splice(currentIndex.value, 1, { ...newConfig, name, isServer });
    configForm.value = { ...configList.value[currentIndex.value] };
    saveAllConfigs();
  };

  const addConfig = (name, config = null) => {
    const newConfig = config ? { ...config, name, isServer: false } : {
      name,
      base_url: '',
      model_name: '',
      api_key: '',
      system_prompt: '',
      extra_params: '{}',
      isServer: false
    };
    configList.value.push(newConfig);
    currentIndex.value = configList.value.length - 1;
    configForm.value = { ...newConfig };
    saveAllConfigs();
  };

  const deleteConfig = (index) => {
    if (index === 0) return;
    configList.value.splice(index, 1);
    if (currentIndex.value >= configList.value.length) {
      currentIndex.value = configList.value.length - 1;
    }
    configForm.value = { ...configList.value[currentIndex.value] };
    saveAllConfigs();
  };

  const renameConfig = (index, newName) => {
    if (index === 0) return;
    const oldItem = configList.value[index];
    // Use splice to ensure array mutation is detected
    configList.value.splice(index, 1, { ...oldItem, name: newName });
    
    if (currentIndex.value === index) {
      configForm.value = { ...configForm.value, name: newName };
    }
    saveAllConfigs();
  };

  const resetConfigToDefault = async () => {
    // For simplicity, reset only the current config if it's not server
    // or reload everything from server if user wants to reset all.
    // The requirement says "reset" button on LlmSettingsDrawer is "reset".
    // Actually, let's keep it simple: if it's server, it's already "default".
    // If it's custom, maybe reset to empty?
    if (currentIndex.value === 0) return;
    
    // Original behavior of reset was fetching backend config.
    // Let's make it fetch backend config and apply to current custom config slot.
    try {
      const backendConfig = await fetchConfig();
      const resetData = {
        base_url: backendConfig.base_url || '',
        model_name: backendConfig.model_name || '',
        api_key: backendConfig.api_key || '',
        system_prompt: backendConfig.system_prompt || '',
        extra_params: backendConfig.extra_params ? JSON.stringify(backendConfig.extra_params, null, 2) : '{}'
      };
      updateConfig(resetData);
    } catch (err) {
      console.error("Failed to reset config");
    }
  };

  return {
    configList,
    currentIndex,
    configForm,
    loadSettings,
    selectConfig,
    addConfig,
    deleteConfig,
    renameConfig,
    updateConfig,
    resetConfigToDefault
  };
}
