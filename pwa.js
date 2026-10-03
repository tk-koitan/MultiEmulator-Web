(() => {
  'use strict';
  const state = window.multiEmulatorPwa = {
    installed: matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
    installable: false, registered: false, offlineReady: false, persistent: false, error: ''
  };
  async function preserveStorage() {
    if (!navigator.storage?.persist) return;
    try {
      state.persistent = await navigator.storage.persisted();
      if (!state.persistent) state.persistent = await navigator.storage.persist();
    } catch (error) { console.warn('Persistent storage request:', error); }
  }
  addEventListener('beforeinstallprompt', () => { state.installable = true; });
  addEventListener('appinstalled', () => {
    state.installed = true; state.installable = false; preserveStorage();
  });
  if (state.installed) addEventListener('pointerdown', preserveStorage, { once: true });
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('./service-worker.js', { scope: './', updateViaCache: 'none' })
    .then(async () => {
      state.registered = true;
      await navigator.serviceWorker.ready;
      state.offlineReady = true;
      if (navigator.storage?.persisted) state.persistent = await navigator.storage.persisted();
    }).catch(error => {
      state.error = String(error); console.warn('PWA cache setup:', error);
    });
})();
