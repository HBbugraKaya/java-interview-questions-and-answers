/**
 * Java Interview Questions & Answers - Interactive Site Engine
 * Features: Dark/Light Mode, Instant Search (Ctrl+K), Code Copy, Mobile Drawer, Sidebar Tree, Reading Progress
 */

(function () {
  'use strict';

  // --- Theme Management ---
  const THEME_KEY = 'ji_theme_preference';

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#f8fafc' : '#090d16');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = theme === 'light'
        ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><span class="sr-only">Toggle dark mode</span>'
        : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><span class="sr-only">Toggle light mode</span>';
    }
  }

  // Initial theme application
  applyTheme(getPreferredTheme());

  document.addEventListener('DOMContentLoaded', () => {
    // Re-apply in case DOM was not ready
    applyTheme(getPreferredTheme());

    // Theme toggle click
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }

    // --- Reading Progress Indicator ---
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      progressBar.style.width = scrolled + '%';

      // Back to top button visibility
      const topBtn = document.getElementById('back-to-top');
      if (topBtn) {
        if (winScroll > 300) {
          topBtn.classList.add('visible');
        } else {
          topBtn.classList.remove('visible');
        }
      }
    }, { passive: true });

    // Back to top button click
    const topBtn = document.getElementById('back-to-top');
    if (topBtn) {
      topBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // --- Mobile Sidebar / Drawer ---
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('site-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const closeDrawerBtn = document.getElementById('sidebar-close-btn');

    function toggleMobileSidebar(open) {
      if (!sidebar) return;
      if (open) {
        sidebar.classList.add('open');
        if (backdrop) backdrop.classList.add('visible');
        document.body.style.overflow = 'hidden';
      } else {
        sidebar.classList.remove('open');
        if (backdrop) backdrop.classList.remove('visible');
        document.body.style.overflow = '';
      }
    }

    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        const isOpen = sidebar.classList.contains('open');
        toggleMobileSidebar(!isOpen);
      });
    }

    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => toggleMobileSidebar(false));
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => toggleMobileSidebar(false));
    }

    // Smoothly scroll section to the top of the sidebar under the header
    function scrollSectionToTop(targetSection, prevExpanded = null) {
      if (!sidebar || !targetSection) return;
      const sidebarTitle = sidebar.querySelector('.sidebar-title');
      const titleHeight = sidebarTitle ? sidebarTitle.offsetHeight : 45;
      const sidebarRect = sidebar.getBoundingClientRect();
      const targetRect = targetSection.getBoundingClientRect();

      let heightLost = 0;
      if (prevExpanded && prevExpanded !== targetSection) {
        // If prevExpanded is placed before targetSection in DOM, its collapse reduces target's future top
        if (prevExpanded.compareDocumentPosition(targetSection) & Node.DOCUMENT_POSITION_FOLLOWING) {
          const prevWrapper = prevExpanded.querySelector('.sidebar-questions-wrapper');
          if (prevWrapper) {
            heightLost = prevWrapper.offsetHeight;
          }
        }
      }

      const currentOffsetFromSidebar = targetRect.top - sidebarRect.top;
      const absoluteTop = sidebar.scrollTop + currentOffsetFromSidebar;
      const finalAbsoluteTop = absoluteTop - heightLost;
      const targetScrollTop = Math.max(0, finalAbsoluteTop - titleHeight - 6);

      sidebar.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
    }

    // Scroll active item/section safely into view on page load
    const activeSection = sidebar ? sidebar.querySelector('.sidebar-section-item.active') : null;
    const activeSidebarItem = document.querySelector('.sidebar-q-link.active');
    if (activeSection && sidebar) {
      // Align active section to the top on page load
      setTimeout(() => {
        const sidebarTitle = sidebar.querySelector('.sidebar-title');
        const titleHeight = sidebarTitle ? sidebarTitle.offsetHeight : 45;
        const sidebarRect = sidebar.getBoundingClientRect();
        const targetRect = activeSection.getBoundingClientRect();
        const targetScrollTop = Math.max(0, sidebar.scrollTop + (targetRect.top - sidebarRect.top) - titleHeight - 6);
        sidebar.scrollTop = targetScrollTop;

        // If the active question is deep inside and scrolled below viewport, ensure it's visible
        if (activeSidebarItem) {
          const itemRect = activeSidebarItem.getBoundingClientRect();
          if (itemRect.bottom > sidebarRect.bottom - 20) {
            sidebar.scrollTop += (itemRect.bottom - sidebarRect.bottom + 40);
          }
        }
      }, 100);
    }

    // Sidebar Accordion with Mutual Collapse and Smooth Scroll-To-Top
    document.querySelectorAll('.sidebar-section-header').forEach(header => {
      header.addEventListener('click', () => {
        const sectionItem = header.closest('.sidebar-section-item');
        if (!sectionItem || !sidebar) return;

        const isCurrentlyExpanded = sectionItem.classList.contains('expanded');

        if (isCurrentlyExpanded) {
          // If already expanded, collapse it
          sectionItem.classList.remove('expanded');
          header.setAttribute('aria-expanded', 'false');
        } else {
          // Mutual collapse: collapse any other currently open section
          const prevExpanded = sidebar.querySelector('.sidebar-section-item.expanded');
          if (prevExpanded && prevExpanded !== sectionItem) {
            prevExpanded.classList.remove('expanded');
            const prevHeader = prevExpanded.querySelector('.sidebar-section-header');
            if (prevHeader) prevHeader.setAttribute('aria-expanded', 'false');
          }

          // Expand the clicked section
          sectionItem.classList.add('expanded');
          header.setAttribute('aria-expanded', 'true');

          // Smoothly scroll the newly opened section to the top of the sidebar under the header
          scrollSectionToTop(sectionItem, prevExpanded);
        }
      });
    });

    // --- Code Copy Buttons ---
    document.querySelectorAll('.markdown-body pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (!code) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block-wrapper';
      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

      // Detect language from class
      let lang = 'Code';
      code.classList.forEach(cls => {
        if (cls.startsWith('language-')) {
          lang = cls.replace('language-', '').toUpperCase();
        }
      });

      const header = document.createElement('div');
      header.className = 'code-block-header';
      header.innerHTML = `
        <span class="code-lang-tag">${lang}</span>
        <button type="button" class="code-copy-btn" aria-label="Copy code">
          <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          <span class="copy-text">Copy</span>
        </button>
      `;

      wrapper.insertBefore(header, pre);

      const copyBtn = header.querySelector('.code-copy-btn');
      copyBtn.addEventListener('click', async () => {
        try {
          const textToCopy = code.innerText;
          await navigator.clipboard.writeText(textToCopy);
          copyBtn.classList.add('copied');
          copyBtn.innerHTML = `
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            <span class="copy-text">Copied!</span>
          `;
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = `
              <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span class="copy-text">Copy</span>
            `;
          }, 2000);
        } catch (err) {
          console.error('Failed to copy code: ', err);
        }
      });
    });

    // --- On-Page Level Navigation / Quick Anchors (Questions only) ---
    const anchorsContainer = document.getElementById('level-anchors');
    const contentBody = document.querySelector('.content-article .markdown-body');
    const currentLang = document.documentElement.lang || 'en';

    if (anchorsContainer && contentBody) {
      const headings = contentBody.querySelectorAll('h2, h3');
      const seenLevels = new Set();
      const chips = [];

      headings.forEach(h => {
        const text = h.innerText.trim();
        let levelKey = null;
        let label = '';
        let chipClass = '';

        if (/junior/i.test(text) || text.includes('🟢')) {
          levelKey = 'junior';
          label = '🟢 Junior';
          chipClass = 'chip-junior';
        } else if (/middle/i.test(text) || text.includes('🟡')) {
          levelKey = 'middle';
          label = '🟡 Middle';
          chipClass = 'chip-middle';
        } else if (/senior/i.test(text) || text.includes('🔴')) {
          levelKey = 'senior';
          label = '🔴 Senior';
          chipClass = 'chip-senior';
        } else if (/шпаргалка|cheat/i.test(text) || text.includes('🎯')) {
          levelKey = 'cheat';
          label = (currentLang === 'ru' || currentLang === 'uk') ? '🎯 Шпаргалка' : '🎯 Cheat Sheet';
          chipClass = 'chip-cheat';
        }

        if (levelKey && !seenLevels.has(levelKey)) {
          seenLevels.add(levelKey);
          if (!h.id) {
            h.id = 'section-' + levelKey;
          }
          chips.push({ id: h.id, label, chipClass });
        }
      });

      if (chips.length > 1) {
        const list = document.createElement('div');
        list.className = 'level-chips-row';
        chips.forEach(c => {
          const a = document.createElement('a');
          a.href = '#' + c.id;
          a.className = `level-chip ${c.chipClass}`;
          a.textContent = c.label;
          list.appendChild(a);
        });
        anchorsContainer.appendChild(list);
      }
    }

    // --- Instant Search Engine (Ctrl + K) ---
    initSearch();
  });

  // --- Search Implementation ---
  let searchIndex = null;
  let searchIndexPromise = null;

  function loadSearchIndex(lang) {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (searchIndexPromise) return searchIndexPromise;

    searchIndexPromise = (async () => {
      let searchFile = 'search-index-en.json';
      if (lang === 'ru') searchFile = 'search-index-ru.json';
      else if (lang === 'uk') searchFile = 'search-index-uk.json';

      const baseTag = document.querySelector('meta[name="baseurl"]');
      const prefix = baseTag ? (baseTag.getAttribute('content') || '') : '';
      const candidates = [
        (prefix + '/assets/data/' + searchFile).replace(/\/+/g, '/'),
        '/assets/data/' + searchFile,
        '../assets/data/' + searchFile,
      ];

      for (const url of candidates) {
        try {
          const response = await fetch(url);
          if (response.ok) {
            searchIndex = await response.json();
            return searchIndex;
          }
        } catch (err) {}
      }
      return null;
    })();

    return searchIndexPromise;
  }

  function initSearch() {
    const modal = document.getElementById('search-modal');
    const openBtn = document.getElementById('search-trigger-btn');
    const heroSearchInput = document.getElementById('hero-search-input');
    const closeBtn = document.getElementById('search-close-btn');
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');
    const currentLang = document.documentElement.lang || 'en';

    if (!modal || !input || !resultsContainer) return;

    function openSearch() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      input.value = '';
      resultsContainer.innerHTML = '<div class="search-empty-state">Type a keyword, topic, or question...</div>';
      setTimeout(() => input.focus(), 50);
      loadSearchIndex(currentLang);
    }

    function closeSearch() {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }

    if (openBtn) openBtn.addEventListener('click', openSearch);
    if (heroSearchInput) {
      heroSearchInput.addEventListener('focus', openSearch);
      heroSearchInput.addEventListener('click', openSearch);
    }
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSearch();
    });

    // Keyboard shortcut: Ctrl+K or / or Escape
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modal.classList.contains('active')) closeSearch();
        else openSearch();
      } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        openSearch();
      } else if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeSearch();
      }
    });

    // Keyboard navigation in search results
    let selectedIndex = -1;

    function updateSelection(items) {
      items.forEach((item, idx) => {
        if (idx === selectedIndex) {
          item.classList.add('selected');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('selected');
        }
      });
    }

    input.addEventListener('keydown', (e) => {
      const items = Array.from(resultsContainer.querySelectorAll('.search-result-item'));
      if (!items.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
        updateSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + items.length) % items.length;
        updateSelection(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          window.location.href = items[selectedIndex].getAttribute('href');
        } else if (items.length > 0) {
          window.location.href = items[0].getAttribute('href');
        }
      }
    });

    // Search Input handling
    let debounceTimer = null;
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        selectedIndex = -1;
        const query = input.value.trim().toLowerCase();
        if (!query) {
          resultsContainer.innerHTML = '<div class="search-empty-state">Type a keyword, topic, or question...</div>';
          return;
        }

        const data = await loadSearchIndex(currentLang);
        if (!data || !data.length) {
          resultsContainer.innerHTML = '<div class="search-empty-state">Search index unavailable.</div>';
          return;
        }

        const queryTokens = query.split(/\s+/).filter(Boolean);
        const matches = data.filter(item => {
          const title = item.title.toLowerCase();
          const sec = item.secTitle.toLowerCase();
          const sum = (item.summary || '').toLowerCase();
          return queryTokens.every(token => title.includes(token) || sec.includes(token) || sum.includes(token));
        });

        if (matches.length === 0) {
          resultsContainer.innerHTML = `<div class="search-empty-state">No answers found for "<strong>${escapeHtml(input.value)}</strong>".</div>`;
          return;
        }

        // Limit results to 25 items for speed
        const topMatches = matches.slice(0, 25);
        let html = `<div class="search-count-header">Found <strong>${matches.length}</strong> matching questions:</div>`;

        topMatches.forEach((item, idx) => {
          const highlightedTitle = highlightMatch(item.title, queryTokens);
          html += `
            <a class="search-result-item" href="${item.url}" data-index="${idx}">
              <div class="search-item-header">
                <span class="search-item-badge">${item.icon} Section ${item.secNumber}: ${escapeHtml(item.secTitle)}</span>
                <span class="search-item-num">#${item.pos}</span>
              </div>
              <div class="search-item-title">${highlightedTitle}</div>
              ${item.summary ? `<div class="search-item-desc">${escapeHtml(item.summary)}</div>` : ''}
            </a>
          `;
        });

        resultsContainer.innerHTML = html;
      }, 120);
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function highlightMatch(text, tokens) {
    let escaped = escapeHtml(text);
    tokens.forEach(token => {
      if (!token) return;
      const regex = new RegExp(`(${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      escaped = escaped.replace(regex, '<mark>$1</mark>');
    });
    return escaped;
  }
})();
