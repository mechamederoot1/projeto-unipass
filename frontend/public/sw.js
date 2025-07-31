const CACHE_NAME = 'unipass-v1';
const STATIC_CACHE = 'unipass-static-v1';
const DYNAMIC_CACHE = 'unipass-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/gyms/,
  /\/api\/users\/me/
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  
  // Force activation
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - Cache strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      handleApiRequest(request)
    );
    return;
  }
  
  // Handle static assets
  event.respondWith(
    handleStaticRequest(request)
  );
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (!shouldCache) {
    // For non-cacheable APIs, just fetch
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Network failed, try cache
    console.log('Service Worker: Network failed, trying cache', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for failed requests
    return new Response(
      JSON.stringify({ error: 'Offline - dados não disponíveis' }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Cache miss, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Fetch failed', error);
    
    // For navigation requests, return the cached index.html
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match('/');
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return a generic offline response
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle background sync (for offline check-ins)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-checkin') {
    event.waitUntil(handleBackgroundCheckin());
  }
});

// Handle background check-in sync
async function handleBackgroundCheckin() {
  // Get pending check-ins from IndexedDB
  const pendingCheckins = await getPendingCheckins();
  
  for (const checkin of pendingCheckins) {
    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${checkin.token}`
        },
        body: JSON.stringify({ gym_id: checkin.gymId })
      });
      
      if (response.ok) {
        // Remove from pending checkins
        await removePendingCheckin(checkin.id);
        
        // Show notification
        self.registration.showNotification('Check-in Realizado!', {
          body: `Check-in realizado com sucesso na ${checkin.gymName}`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'checkin-success',
          data: { url: '/profile' }
        });
      }
    } catch (error) {
      console.error('Background checkin failed:', error);
    }
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  let data = {};
  
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body || 'Nova mensagem do Unipass',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: data.data || {},
    actions: [
      {
        action: 'open',
        title: 'Abrir App'
      },
      {
        action: 'close',
        title: 'Fechar'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Unipass', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Utility functions for IndexedDB (pending checkins)
async function getPendingCheckins() {
  // Simple implementation - in production, use IndexedDB
  try {
    const stored = localStorage.getItem('pendingCheckins');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function removePendingCheckin(id) {
  try {
    const stored = localStorage.getItem('pendingCheckins');
    const checkins = stored ? JSON.parse(stored) : [];
    const filtered = checkins.filter(c => c.id !== id);
    localStorage.setItem('pendingCheckins', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing pending checkin:', error);
  }
}
