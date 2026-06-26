(function () {
  'use strict';

  const EXTERNAL_CONSENT_ID = 'external';
  const MAP_SELECTOR = '[data-google-map]';
  const PREFERENCES_SELECTOR = '[data-open-cookie-preferences]';

  function getConsentManager() {
    if (!window.silktideConsentManager || typeof window.silktideConsentManager.getInstance !== 'function') {
      return null;
    }

    return window.silktideConsentManager.getInstance();
  }

  function loadGoogleMaps() {
    document.querySelectorAll(MAP_SELECTOR).forEach(container => {
      if (container.querySelector('iframe[data-google-map-frame]')) return;

      const mapSrc = container.dataset.mapSrc;
      if (!mapSrc) return;

      const iframe = document.createElement('iframe');
      iframe.dataset.googleMapFrame = 'true';
      iframe.src = mapSrc;
      iframe.title = container.dataset.mapTitle || 'Mappa Google Maps';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;

      const placeholder = container.querySelector('[data-google-map-placeholder]');
      if (placeholder) placeholder.hidden = true;

      container.appendChild(iframe);
      container.classList.add('is-loaded');
    });
  }

  function removeGoogleMaps() {
    document.querySelectorAll(MAP_SELECTOR).forEach(container => {
      container.querySelectorAll('iframe[data-google-map-frame]').forEach(iframe => iframe.remove());

      const placeholder = container.querySelector('[data-google-map-placeholder]');
      if (placeholder) placeholder.hidden = false;

      container.classList.remove('is-loaded');
    });
  }

  function hasExternalConsent() {
    const manager = getConsentManager();
    return Boolean(manager && manager.getConsentChoice(EXTERNAL_CONSENT_ID) === true);
  }

  function openCookiePreferences() {
    const manager = getConsentManager();
    if (!manager) return;

    if (!manager.preferences && typeof manager.createModal === 'function') {
      manager.createModal();
    }

    if (typeof manager.toggleModal === 'function') {
      manager.toggleModal(true);
    }
  }

  function initialiseConsentManager() {
    if (!window.silktideConsentManager || typeof window.silktideConsentManager.init !== 'function') {
      removeGoogleMaps();
      return;
    }

    window.silktideConsentManager.init({
      namespace: 'studioyogis',
      prompt: {
        position: 'bottomRight'
      },
      icon: {
        position: 'bottomLeft'
      },
      backdrop: {
        show: false
      },
      consentTypes: [
        {
          id: 'essential',
          label: 'Necessari',
          description: 'Cookie tecnici e preferenze indispensabili per far funzionare il sito e memorizzare le scelte sul consenso.',
          required: true,
          defaultValue: true
        },
        {
          id: EXTERNAL_CONSENT_ID,
          label: 'Mappe e contenuti esterni',
          description: 'Consente di caricare Google Maps per visualizzare la posizione dello studio. Il servizio puo trattare dati tecnici del dispositivo e della navigazione.',
          defaultValue: false,
          onAccept: loadGoogleMaps,
          onReject: removeGoogleMaps
        }
      ],
      text: {
        prompt: {
          description: '<p>Usiamo solo strumenti essenziali. Google Maps viene caricato solo con il tuo consenso alla categoria Mappe e contenuti esterni.</p>',
          acceptAllButtonText: 'Accetta tutti',
          acceptAllButtonAccessibleLabel: 'Accetta tutti i cookie e contenuti esterni',
          rejectNonEssentialButtonText: 'Rifiuta non necessari',
          rejectNonEssentialButtonAccessibleLabel: 'Rifiuta i cookie e contenuti non necessari',
          preferencesButtonText: 'Preferenze cookie',
          preferencesButtonAccessibleLabel: 'Gestisci le preferenze cookie'
        },
        preferences: {
          title: 'Preferenze cookie',
          description: '<p>Puoi scegliere se consentire il caricamento di Google Maps. I font sono serviti localmente e non usiamo analytics, pixel o tag marketing.</p>',
          saveButtonText: 'Salva preferenze',
          saveButtonAccessibleLabel: 'Salva le preferenze cookie',
          creditLinkText: 'Silktide Consent Manager',
          creditLinkAccessibleLabel: 'Vai al sito di Silktide Consent Manager'
        }
      },
      onAcceptAll: loadGoogleMaps,
      onRejectAll: removeGoogleMaps
    });

    if (hasExternalConsent()) {
      loadGoogleMaps();
    } else {
      removeGoogleMaps();
    }
  }

  document.addEventListener('click', event => {
    const trigger = event.target.closest(PREFERENCES_SELECTOR);
    if (!trigger) return;

    event.preventDefault();
    openCookiePreferences();
  });

  window.loadGoogleMaps = loadGoogleMaps;
  window.yogisCookieConsent = {
    loadGoogleMaps,
    removeGoogleMaps,
    openCookiePreferences
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseConsentManager, { once: true });
  } else {
    initialiseConsentManager();
  }
}());
