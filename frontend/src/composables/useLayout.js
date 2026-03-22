import { ref } from 'vue';

export function useLayout() {
  const isFullWidth = ref(localStorage.getItem('isFullWidth') === 'true');

  const toggleFullWidth = () => {
    isFullWidth.value = !isFullWidth.value;
    localStorage.setItem('isFullWidth', isFullWidth.value.toString());
  };
  
  const setFullWidth = (val) => {
    isFullWidth.value = val;
    localStorage.setItem('isFullWidth', val.toString());
  };

  return {
    isFullWidth,
    toggleFullWidth,
    setFullWidth
  };
}
