/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('sync', (event: any) => {
  if (event.tag === 'chart-autosave') {
    event.waitUntil(syncPendingSaves());
  }
});

async function syncPendingSaves() {
  console.log('Background sync: chart-autosave triggered');
  // In a real app, this would read from IndexedDB and push to a cloud API.
  // For this local-only app, the save is already in IndexedDB, so we just log it.
}

self.addEventListener('fetch', (event: any) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const file = formData.get('file');
        
        // Send the file to the client
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.postMessage({ type: 'SHARED_FILE', file });
        }
        
        // Redirect back to the app
        return Response.redirect('/', 303);
      })()
    );
  }
});
