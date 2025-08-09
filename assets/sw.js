/**
 * GAG Recipe App Service Worker
 * Implements offline caching, resource preloading and update strategies
 */

const CACHE_NAME = 'gag-recipes-v4';
const DATA_CACHE_NAME = 'gag-recipes-data-v4';

// Static resources to precache
const PRECACHE_URLS = [
  './',
  './index.html',
  './assets/tokens.css',
  './assets/components.css',
  './assets/app.js',
  './assets/recipes.json'
];

// Image resources to cache (placeholder)
const IMAGE_URLS = [
  './images/placeholder.svg'
];

// ==================== Install Event ====================
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching static resources');
        return cache.addAll(PRECACHE_URLS);
      }),
      
      // Preload image resources (optional, avoid blocking installation)
      caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Preloading image resources');
        return Promise.allSettled(
          IMAGE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[SW] Cannot cache image: ${url}`, err);
            })
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Force activate new Service Worker
      return self.skipWaiting();
    })
  );
});

// ==================== Activate Event ====================
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Immediately control all clients
      self.clients.claim()
    ]).then(() => {
      console.log('[SW] Activation complete');
    })
  );
});

// ==================== Network Request Interception ====================
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Only handle same-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Use different strategies based on resource type
  if (request.url.includes('/recipes.json')) {
    // Data files: Network first, fallback to cache
    event.respondWith(networkFirst(request, DATA_CACHE_NAME));
  } else if (request.url.includes('/image/') || request.url.includes('/images/')) {
    // Image resources: Cache first, fallback to network
    event.respondWith(cacheFirst(request, CACHE_NAME));
  } else if (request.url.includes('.css') || request.url.includes('.js')) {
    // Static resources: Cache first
    event.respondWith(cacheFirst(request, CACHE_NAME));
  } else if (request.mode === 'navigate') {
    // HTML pages: Network first, fallback to cache
    event.respondWith(networkFirst(request, CACHE_NAME));
  }
});

// ==================== Cache Strategy Implementation ====================

/**
 * Network first strategy: Try network request first, fallback to cache
 * Suitable for frequently updated resources (HTML, JSON data)
 */
async function networkFirst(request, cacheName) {
  try {
    // Try network request
    const networkResponse = await fetch(request);
    
    // If successful, update cache
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Cache also empty, return offline page or error
    return createOfflineResponse(request);
  }
}

/**
 * Cache first strategy: Check cache first, request network if not found
 * Suitable for rarely changing resources (CSS, JS, images)
 */
async function cacheFirst(request, cacheName) {
  // Check cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Cache empty, request network
    const networkResponse = await fetch(request);
    
    // Cache response
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network and cache both failed:', request.url);
    return createOfflineResponse(request);
  }
}

/**
 * Check if it's a static resource
 */
function isStaticResource(url) {
  return url.includes('.css') || 
         url.includes('.js') || 
         url.includes('.png') || 
         url.includes('.jpg') || 
         url.includes('.svg');
}

/**
 * Create offline response
 */
function createOfflineResponse(request) {
  if (request.destination === 'image') {
    // Return placeholder for image resources
    const svg = 
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#9ca3af">Image Load Failed</text></svg>';
    
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  if (request.mode === 'navigate') {
    // Return offline notice for HTML pages
    const offlineHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Offline Mode - GAG Recipes</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .container {
            max-width: 500px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
          }
          h1 { font-size: 2.5em; margin-bottom: 0.5em; }
          h2 { font-size: 1.5em; margin-bottom: 1em; opacity: 0.9; }
          p { font-size: 1.1em; line-height: 1.6; margin-bottom: 2em; opacity: 0.8; }
          .retry-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: background 0.3s;
          }
          .retry-btn:hover { background: #45a049; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🍔 GAG Recipes</h1>
          <h2>Currently in Offline Mode</h2>
          <p>There seems to be a network connection issue, but you can still browse cached recipe content.</p>
          <button class="retry-btn" onclick="location.reload()">Retry Connection</button>
        </div>
      </body>
      </html>
    `;
    
    return new Response(offlineHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      }
    });
  }
  
  // Return basic error response for other resources
  return new Response('Resource unavailable', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache'
    }
  });
}

// ==================== Message Handling ====================
self.addEventListener('message', event => {
  const { data } = event;
  
  switch (data.type) {
    case 'FORCE_UPDATE':
      // Force update
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      // Return version info
      event.ports[0].postMessage({
        version: CACHE_NAME,
        timestamp: Date.now()
      });
      break;
      
    case 'CLEAR_CACHE':
      // Clear all caches
      event.waitUntil(
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        })
      );
      break;
      
    default:
      console.log('[SW] Unknown message type:', data.type);
  }
});

// ==================== Background Sync (Optional) ====================
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Executing background sync');
    event.waitUntil(
      // Here you can perform some background tasks
      // such as syncing user data, updating cache, etc.
      doBackgroundSync().catch(error => {
        console.log('[SW] Background sync failed:', error);
      })
    );
  }
});

async function doBackgroundSync() {
  try {
    // Update recipe data
    const response = await fetch('./assets/recipes.json');
    if (response.ok) {
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put('./assets/recipes.json', response);
      console.log('[SW] Background recipe data update successful');
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error);
  }
}

// ==================== Push Notifications (Optional) ====================
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New GAG recipes available!',
    icon: './images/icon-192.png',
    badge: './images/badge-72.png',
    tag: 'gag-recipes-update',
    actions: [
      {
        action: 'view',
        title: 'View Recipes'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('GAG Recipe Updates', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

console.log('[SW] Service Worker script loaded');