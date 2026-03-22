import { ref, reactive } from 'vue';

const savedLocale = localStorage.getItem('chat_locale') || (navigator.language.startsWith('zh') ? 'zh' : 'en');
export const locale = ref(savedLocale);

const translations = {
  zh: {
    // App
    newChat: '新对话',
    stream: '流式',
    fullWidth: '全宽',
    pageSettings: '页面配置',
    llmConfig: 'LLM 配置',
    language: '语言',
    howCanIHelp: '今天我能帮您什么？',
    confirmDelete: '确定要删除此对话吗？',
    confirmClearAll: '确定要清空所有对话记录吗？此操作无法撤销。',
    configTip: '请先在右侧【配置】中填写您的 API Base URL 和模型名等参数。',

    // Sidebar
    history: '历史会话',
    clearAll: '清空所有',

    // LlmSettingsDrawer
    llmSettingsTitle: '模型配置',
    baseUrl: 'API 基础路径',
    apiKey: 'API 密钥',
    modelName: '模型名称',
    systemPrompt: '系统提示词',
    extraParams: '额外请求参数',
    save: '保存',
    reset: '重置',

    // PageSettingsDrawer
    uiSettingsTitle: '页面设置',
    fontSize: '渲染字体大小',
    close: '关闭',

    // ChatInput
    inputPlaceholder: '在此输入您的消息... (支持粘贴图片, Shift+Enter 换行)',
    attachImage: '附加图片',
    stop: '停止对话',
    regenerate: '重新生成',
    send: '发送',
    update: '更新',

    // ChatMessage
    copy: '复制',
    edit: '编辑消息',
    firstToken: '首字',
    totalTime: '总耗时',
    totalChars: '总字数',
    charsUnit: '字',
    tokens: 'Tokens',
    speed: '速度',
    reasoning: '思考过程',
    copied: '已复制!',
    copyCode: '复制代码',

    // ImageViewer
    zoomIn: '放大',
    zoomOut: '缩小',
    actualSize: '实际大小',
    fitScreen: '自适应'
  },
  en: {
    // App
    newChat: 'New Chat',
    stream: 'Stream Mode',
    fullWidth: 'Full Width',
    pageSettings: 'Page Settings',
    llmConfig: 'LLM Config',
    language: 'Language',
    howCanIHelp: 'How can I help you today?',
    confirmDelete: 'Are you sure you want to delete this chat?',
    confirmClearAll: 'Are you sure you want to clear all chat history? This action cannot be undone.',
    configTip: 'Please fill in your API Base URL and Model Name in the 【Config】 panel first.',

    // Sidebar
    history: 'History',
    clearAll: 'Clear All',

    // LlmSettingsDrawer
    llmSettingsTitle: 'LLM Configuration',
    baseUrl: 'API Base URL',
    apiKey: 'API Key',
    modelName: 'Model Name',
    systemPrompt: 'System Prompt',
    extraParams: 'Extra Params (JSON)',
    save: 'Save',
    reset: 'Reset',

    // PageSettingsDrawer
    uiSettingsTitle: 'UI Settings',
    fontSize: 'Chat Font Size',
    close: 'Close',

    // ChatInput
    inputPlaceholder: 'Shift + Enter for new line, Enter to send',
    attachImage: 'Attach Image',
    stop: 'Stop Generation',
    regenerate: 'Regenerate',
    send: 'Send',
    update: 'Update',

    // ChatMessage
    copy: 'Copy',
    edit: 'Edit Message',
    firstToken: 'TTFT',
    totalTime: 'Total Time',
    totalChars: 'Total Chars',
    charsUnit: 'Chars',
    tokens: 'Tokens',
    speed: 'Speed',
    reasoning: 'Reasoning',
    copied: 'Copied!',
    copyCode: 'Copy',

    // ImageViewer
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    actualSize: 'Actual Size',
    fitScreen: 'Fit Screen'
  }
};

export const t = (key) => {
  return translations[locale.value][key] || key;
};

export const setLocale = (l) => {
  locale.value = l;
  localStorage.setItem('chat_locale', l);
};
