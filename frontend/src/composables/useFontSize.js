import { ref } from 'vue';

export function useFontSize() {
  const pageFontSize = ref(parseInt(localStorage.getItem('chatFontSize')) || 18);

  const savePageFontSize = (size) => {
    pageFontSize.value = size;
    localStorage.setItem('chatFontSize', size);
  };

  const previewPageFontSize = (size) => {
    pageFontSize.value = size;
  };

  const resetPageFontSize = () => {
    pageFontSize.value = 18;
    localStorage.removeItem('chatFontSize');
  };

  return {
    pageFontSize,
    savePageFontSize,
    previewPageFontSize,
    resetPageFontSize
  };
}
