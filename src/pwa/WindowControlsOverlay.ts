export function setupWindowControlsOverlay() {
  if ('windowControlsOverlay' in navigator) {
    const wco = navigator.windowControlsOverlay as any;
    wco.addEventListener('geometrychange', updateLayout);
    updateLayout();
  }
}

function updateLayout() {
  if (!('windowControlsOverlay' in navigator)) return;
  const wco = navigator.windowControlsOverlay as any;
  const rect = wco.getTitlebarAreaRect();
  
  const titlebar = document.getElementById('app-titlebar');
  const mainContent = document.getElementById('main-content');
  
  if (titlebar && mainContent) {
    if (wco.visible) {
      titlebar.style.display = 'flex';
      titlebar.style.top = `${rect.y}px`;
      titlebar.style.left = `${rect.x}px`;
      titlebar.style.width = `${rect.width}px`;
      titlebar.style.height = `${rect.height}px`;
      mainContent.style.marginTop = `${rect.height}px`;
    } else {
      titlebar.style.display = 'none';
      mainContent.style.marginTop = '0';
    }
  }
}
