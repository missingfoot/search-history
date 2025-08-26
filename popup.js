class HistoryFilter {
  constructor() {
    this.filters = [{ id: 0, value: '', operator: 'include', searchField: 'url' }];
    this.filterId = 0;
    this.historyItems = [];
    this.currentFilteredItems = [];
    this.displayedCount = 100;
    this.closedWindows = [];
    this.openWindows = [];
    this.windowCache = new Map(); // Cache window data for tracking when closed
    this.chromeSessions = []; // Store Chrome's native recently closed sessions

    // Tabs tab properties
    this.tabsFilters = [{ id: 0, value: '', operator: 'include', searchField: 'url' }];
    this.tabsFilterId = 0;
    this.allTabs = []; // All open tabs from all windows
    this.tabsCurrentFilteredItems = [];

    this.init();
  }

    async init() {
    // Load saved time range or default to 'week'
    const savedTimeRange = localStorage.getItem('historyFilterTimeRange') || 'week';
    document.getElementById('time-range').value = savedTimeRange;

    // Load saved show titles preference (default to true)
    const savedShowTitles = localStorage.getItem('historyFilterShowTitles');
    const showTitles = savedShowTitles !== null ? JSON.parse(savedShowTitles) : true;
    document.getElementById('show-titles').checked = showTitles;

    // Removed show only open tabs - now handled by dedicated Tabs tab

    // Load saved filters
    this.loadSavedFilters();

    this.loadHistory(savedTimeRange).then(() => {
      // Apply saved filters after history is loaded
      this.applyFilters();
    });

    this.setupEventListeners();
    this.setupTabsEventListeners();
    this.setupTabListeners();

    // Load and set the last active tab
    this.loadActiveTab();

    this.setupWindowTracking();

    this.loadClosedWindows();
    await this.loadOpenWindows();
    await this.loadChromeSessions();
    this.displayWindows();

    // Initialize tabs functionality
    this.loadSavedTabsFilters();
    this.updateTabsClearButtonVisibility();
    await this.loadAllTabs();
    this.displayTabs(this.allTabs);

    // Clean up old cache entries periodically
    setInterval(() => {
      this.cleanupWindowCache();
    }, 30 * 60 * 1000); // Every 30 minutes
  }

  async loadHistory(timeRange = 'all') {
    try {
      const searchParams = {
        text: ''
      };
      
      const now = Date.now();
      switch (timeRange) {
        case '48hours':
          searchParams.startTime = now - (2 * 24 * 60 * 60 * 1000);
          searchParams.maxResults = 5000;
          break;
        case 'week':
          searchParams.startTime = now - (7 * 24 * 60 * 60 * 1000);
          searchParams.maxResults = 10000;
          break;
        case 'month':
          searchParams.startTime = now - (30 * 24 * 60 * 60 * 1000);
          searchParams.maxResults = 50000;
          break;
        case 'year':
        default:
          searchParams.startTime = now - (365 * 24 * 60 * 60 * 1000);
          searchParams.maxResults = 100000;
          break;
      }
      
      this.historyItems = await chrome.history.search(searchParams);
      
      // Get all currently open tabs
      const openTabs = await chrome.tabs.query({});
      this.openTabsMap = new Map();
      openTabs.forEach(tab => {
        this.openTabsMap.set(tab.url, tab.id);
      });
    } catch (error) {
      console.error('Error loading history:', error);
    }
  }

  setupEventListeners() {
    const addFilterBtn = document.getElementById('add-filter');
    addFilterBtn.addEventListener('click', () => this.addFilter());

    const clearFiltersBtn = document.getElementById('clear-filters');
    clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());

    const showTitlesCheckbox = document.getElementById('show-titles');
    showTitlesCheckbox.addEventListener('change', (e) => {
      // Save the show titles preference
      localStorage.setItem('historyFilterShowTitles', JSON.stringify(e.target.checked));
      this.displayResults(this.currentFilteredItems);
    });

    // Removed show only open tabs event listener - now handled by dedicated Tabs tab

    const openAllBtn = document.getElementById('open-all-btn');
    openAllBtn.addEventListener('click', () => this.openAllInNewWindow());



    // Time range event listener is set up after filters are created
    this.setupTimeRangeListener();

    this.setupFilterListener(0);
  }

  // Tabs-specific event listeners
  setupTabsEventListeners() {
    const tabsAddFilterBtn = document.getElementById('tabs-add-filter');
    tabsAddFilterBtn.addEventListener('click', () => this.addTabsFilter());

    const tabsClearFiltersBtn = document.getElementById('tabs-clear-filters');
    tabsClearFiltersBtn.addEventListener('click', () => this.clearAllTabsFilters());

    // Titles are always shown by default - no checkbox needed

    // Open in Window button removed - not needed

    // No time range for tabs - always current

    this.setupTabsFilterListener(0);
  }

  // Load all open tabs from all windows
  async loadAllTabs() {
    try {
      const windows = await chrome.windows.getAll({ populate: true });

      // Convert tabs to our format similar to history items
      this.allTabs = [];
      windows.forEach(window => {
        const windowName = window.tabs.length > 0 && window.tabs.find(tab => tab.active)?.title
          ? `Window: ${window.tabs.find(tab => tab.active)?.title}`
          : `Window ${window.id}`;

        window.tabs.forEach(tab => {
          this.allTabs.push({
            id: tab.id,
            url: tab.url,
            title: tab.title || 'Untitled',
            windowId: window.id,
            windowName: windowName,
            favIconUrl: tab.favIconUrl,
            active: tab.active,
            lastAccessed: Date.now() // Use current time for open tabs
          });
        });
      });

      // No time filtering for current open tabs

    } catch (error) {
      console.error('Error loading tabs:', error);
      this.allTabs = [];
    }
  }

  // Apply tabs filters (reused from history filtering logic)
  applyTabsFilters() {
    const activeFilters = this.tabsFilters.filter(f => f.value.trim() !== '');

    if (activeFilters.length === 0) {
      // No active filters - show all tabs
      this.displayTabs(this.allTabs);
      return;
    }

    let filteredTabs = this.allTabs;

    for (let i = 0; i < activeFilters.length; i++) {
      const filter = activeFilters[i];
      const filterValue = filter.value.toLowerCase();

      if (i === 0) {
        filteredTabs = filteredTabs.filter(tab => {
          if (filter.searchField === 'title') {
            const title = (tab.title || '').toLowerCase();
            return title.includes(filterValue);
          } else {
            const url = tab.url.toLowerCase();
            return url.includes(filterValue);
          }
        });
      } else {
        if (filter.operator === 'include') {
          filteredTabs = filteredTabs.filter(tab => {
            if (filter.searchField === 'title') {
              const title = (tab.title || '').toLowerCase();
              return title.includes(filterValue);
            } else {
              const url = tab.url.toLowerCase();
              return url.includes(filterValue);
            }
          });
        } else if (filter.operator === 'exclude') {
          filteredTabs = filteredTabs.filter(tab => {
            if (filter.searchField === 'title') {
              const title = (tab.title || '').toLowerCase();
              return !title.includes(filterValue);
            } else {
              const url = tab.url.toLowerCase();
              return !url.includes(filterValue);
            }
          });
        }
      }
    }

    this.displayTabs(filteredTabs);
  }

    // Display tabs grouped by window
  displayTabs(items, append = false) {
    // Safety check for items parameter
    if (!items || !Array.isArray(items)) {
      items = [];
    }

    const tabsResultsContainer = document.getElementById('tabs-results-list');
    const tabsLoading = document.getElementById('tabs-loading');
    const tabsResultsHeader = document.getElementById('tabs-results-header');
    const tabsResultsCount = document.getElementById('tabs-results-count');

    // Safety check for DOM elements
    if (!tabsResultsContainer || !tabsLoading || !tabsResultsHeader || !tabsResultsCount) {
      console.error('Required DOM elements for tabs not found');
      return;
    }

    // Check if there are active filters
    const activeFilters = this.tabsFilters.filter(f => f.value.trim() !== '');

    if (!append) {
      this.tabsCurrentFilteredItems = items;
      tabsLoading.style.display = 'none';

      if (items.length === 0) {
        tabsResultsHeader.style.display = 'none';
        tabsResultsContainer.innerHTML = '<div class="no-results">No matching tabs found</div>';
        return;
      }

      // Only show results header when there are active filters
      if (activeFilters.length > 0) {
        tabsResultsHeader.style.display = 'flex';
        tabsResultsCount.textContent = `${items.length} tab${items.length !== 1 ? 's' : ''}`;
      } else {
        tabsResultsHeader.style.display = 'none';
      }
    }

    // Get active filter terms for highlighting
    const urlSearchTerms = activeFilters.filter(f => f.searchField === 'url').map(f => f.value.trim());
    const titleSearchTerms = activeFilters.filter(f => f.searchField === 'title').map(f => f.value.trim());

    // Group tabs by window
    const groupedTabs = {};
    const tabsToDisplay = items; // Show all items, no pagination

    tabsToDisplay.forEach(tab => {
      const windowKey = tab.windowName;
      if (!groupedTabs[windowKey]) {
        groupedTabs[windowKey] = [];
      }
      groupedTabs[windowKey].push(tab);
    });

    let tabsHtml = '';

    // Display tabs grouped by window using date group headers as dividers
    Object.keys(groupedTabs).forEach(windowName => {
      // Add window name header (reusing date group header style)
      tabsHtml += `<div class="date-group-header">${windowName}</div>`;

      // Add tabs in this window
      groupedTabs[windowName].forEach(tab => {
        const highlightedUrl = this.highlightMatches(tab.url, urlSearchTerms);
        const highlightedTitle = tab.title ? this.highlightMatches(tab.title, titleSearchTerms) : '';
        const titleHtml = tab.title ? `<div class="result-title">${highlightedTitle}</div>` : '';

        const activeClass = tab.active ? ' active-tab' : '';

        tabsHtml += `
          <div class="tab-item${activeClass}" data-tab-id="${tab.id}" data-window-id="${tab.windowId}">
            ${titleHtml}
            <a href="${tab.url}" class="result-url" target="_blank" title="${tab.url}">
              ${highlightedUrl}
            </a>
            ${tab.active ? '<span class="active-indicator">Active</span>' : ''}
          </div>
        `;
      });
    });

    tabsResultsContainer.innerHTML = tabsHtml;

    // Add click listeners for tab items
    tabsResultsContainer.querySelectorAll('.tab-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const tabId = parseInt(item.dataset.tabId);
        const windowId = parseInt(item.dataset.windowId);

        try {
          // Switch to the tab's window and activate the tab
          await chrome.windows.update(windowId, { focused: true });
          await chrome.tabs.update(tabId, { active: true });
        } catch (error) {
          console.error('Error switching to tab:', error);
          // Fallback: open URL in new tab
          const url = item.querySelector('.result-url').href;
          chrome.tabs.create({ url: url });
        }
      });
    });

    // No pagination - all tabs shown at once
  }

  // Tabs filter management methods
  addTabsFilter() {
    this.tabsFilterId++;
    const newFilter = { id: this.tabsFilterId, value: '', operator: 'include', searchField: 'title' };
    this.tabsFilters.push(newFilter);

    this.createTabsFilterRow(newFilter);
    this.saveTabsFilters();
    this.updateTabsClearButtonVisibility();
  }

  clearAllTabsFilters() {
    this.tabsFilters = [{ id: 0, value: '', operator: 'include', searchField: 'title' }];
    this.tabsFilterId = 0;

    localStorage.removeItem('tabsFilterState');

    const tabsFiltersContainer = document.getElementById('tabs-filters-list');
    tabsFiltersContainer.innerHTML = '';
    this.createTabsFilterRow(this.tabsFilters[0]);

    this.updateTabsClearButtonVisibility();
    this.applyTabsFilters();
  }

  // Save/load tabs filters
  saveTabsFilters() {
    const filterData = {
      filters: this.tabsFilters,
      nextId: this.tabsFilterId
    };
    localStorage.setItem('tabsFilterState', JSON.stringify(filterData));
  }

  loadSavedTabsFilters() {
    try {
      const saved = localStorage.getItem('tabsFilterState');
      if (saved) {
        const filterData = JSON.parse(saved);
        this.tabsFilters = filterData.filters || [{ id: 0, value: '', operator: 'include', searchField: 'title' }];
        this.tabsFilterId = filterData.nextId || 0;

        this.tabsFilters.forEach(filter => {
          if (!filter.searchField) {
            filter.searchField = 'title';
          }
        });

        const tabsFiltersContainer = document.getElementById('tabs-filters-list');
        tabsFiltersContainer.innerHTML = '';

        this.tabsFilters.forEach(filter => {
          this.createTabsFilterRow(filter);
        });

        // Ensure the first filter defaults to title search for tabs
        if (this.tabsFilters.length > 0 && !this.tabsFilters[0].searchField) {
          this.tabsFilters[0].searchField = 'title';
        }

        this.updateTabsClearButtonVisibility();
      }
    } catch (error) {
      console.error('Error loading saved tabs filters:', error);
      this.tabsFilters = [{ id: 0, value: '', operator: 'include', searchField: 'title' }];
      this.tabsFilterId = 0;
      this.updateTabsClearButtonVisibility();
    }
  }

  // Create tabs filter row
  createTabsFilterRow(filter) {
    const tabsFiltersContainer = document.getElementById('tabs-filters-list');
    const filterRow = document.createElement('div');
    filterRow.className = 'filter-row';

    if (filter.id === 0) {
      filterRow.innerHTML = `
        <select class="search-field-select" data-filter-id="${filter.id}">
          <option value="url" ${filter.searchField === 'url' ? 'selected' : ''}>URL</option>
          <option value="title" ${filter.searchField === 'title' ? 'selected' : ''}>Title</option>
        </select>
        <input type="text" class="filter-input" placeholder="Enter search text..." data-filter-id="${filter.id}" value="${filter.value}">
        <select class="operator-select" data-filter-id="${filter.id}" style="display: none;">
          <option value="include">Include</option>
          <option value="exclude">Exclude</option>
        </select>
      `;
    } else {
      filterRow.innerHTML = `
        <select class="search-field-select" data-filter-id="${filter.id}">
          <option value="url" ${filter.searchField === 'url' ? 'selected' : ''}>URL</option>
          <option value="title" ${filter.searchField === 'title' ? 'selected' : ''}>Title</option>
        </select>
        <select class="operator-select" data-filter-id="${filter.id}">
          <option value="include" ${filter.operator === 'include' ? 'selected' : ''}>Include</option>
          <option value="exclude" ${filter.operator === 'exclude' ? 'selected' : ''}>Exclude</option>
        </select>
        <input type="text" class="filter-input" placeholder="Enter search text..." data-filter-id="${filter.id}" value="${filter.value}">
        <button class="btn-secondary btn-secondary-icon" data-filter-id="${filter.id}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;
    }

    tabsFiltersContainer.appendChild(filterRow);
    this.setupTabsFilterListener(filter.id);

    if (filter.id !== 0) {
      const removeBtn = filterRow.querySelector('.btn-secondary-icon');
      removeBtn.addEventListener('click', () => this.removeTabsFilter(filter.id, filterRow));
    }
  }

  // Tabs filter listener setup
  setupTabsFilterListener(filterId) {
    const input = document.querySelector(`#tabs-filters-list input[data-filter-id="${filterId}"]`);
    if (input) {
      input.addEventListener('input', (e) => {
        this.updateTabsFilter(filterId, e.target.value);
        this.applyTabsFilters();
      });
    }

    const operatorSelect = document.querySelector(`#tabs-filters-list select[data-filter-id="${filterId}"].operator-select`);
    if (operatorSelect) {
      operatorSelect.addEventListener('change', (e) => {
        this.updateTabsOperator(filterId, e.target.value);
        this.applyTabsFilters();
      });
    }

    const searchFieldSelect = document.querySelector(`#tabs-filters-list select[data-filter-id="${filterId}"].search-field-select`);
    if (searchFieldSelect) {
      searchFieldSelect.addEventListener('change', (e) => {
        this.updateTabsSearchField(filterId, e.target.value);
        this.applyTabsFilters();
      });
    }
  }



  // Tabs filter update methods
  updateTabsFilter(filterId, value) {
    const filter = this.tabsFilters.find(f => f.id === filterId);
    if (filter) {
      filter.value = value;
      this.saveTabsFilters();
      this.updateTabsClearButtonVisibility();
    }
  }

  updateTabsOperator(filterId, operator) {
    const filter = this.tabsFilters.find(f => f.id === filterId);
    if (filter) {
      filter.operator = operator;
      this.saveTabsFilters();
      this.updateTabsClearButtonVisibility();
    }
  }

  updateTabsSearchField(filterId, searchField) {
    const filter = this.tabsFilters.find(f => f.id === filterId);
    if (filter) {
      filter.searchField = searchField;
      this.saveTabsFilters();
      this.updateTabsClearButtonVisibility();
    }
  }

  removeTabsFilter(filterId, element) {
    this.tabsFilters = this.tabsFilters.filter(f => f.id !== filterId);
    element.remove();
    this.saveTabsFilters();
    this.updateTabsClearButtonVisibility();
    this.applyTabsFilters();
  }

  // Update tabs clear button visibility
  updateTabsClearButtonVisibility() {
    const clearBtn = document.getElementById('tabs-clear-filters');
    const hasActiveFilters = this.tabsFilters.some(f => f.value.trim() !== '') || this.tabsFilters.length > 1;
    clearBtn.style.display = hasActiveFilters ? 'block' : 'none';
  }

  setupTabListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;

        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        // Show/hide tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => content.classList.remove('active'));

        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
          targetTab.classList.add('active');
        }

        // Save the current active tab
        this.saveActiveTab(tabName);


      });
    });
  }

  // Save the currently active tab to localStorage
  saveActiveTab(tabName) {
    try {
      localStorage.setItem('activeTab', tabName);
    } catch (error) {
      console.error('Error saving active tab:', error);
    }
  }

  // Load and set the last active tab from localStorage
  loadActiveTab() {
    try {
      const savedTab = localStorage.getItem('activeTab');
      if (savedTab) {
        // Switch to the saved tab
        this.switchToTab(savedTab);
      }
      // If no saved tab, it defaults to history (which is already active)
    } catch (error) {
      console.error('Error loading active tab:', error);
    }
  }

  // Switch to a specific tab programmatically
  switchToTab(tabName) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const targetButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    const targetTab = document.getElementById(`${tabName}-tab`);

    if (targetButton && targetTab) {
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      targetButton.classList.add('active');

      // Show/hide tab content
      const tabContents = document.querySelectorAll('.tab-content');
      tabContents.forEach(content => content.classList.remove('active'));
      targetTab.classList.add('active');
    }
  }

  setupWindowTracking() {
    // console.log removed

    // Listen for window close events
    chrome.windows.onRemoved.addListener(async (windowId) => {
      // console.log removed
      // console.log removed
      // console.log removed

      // Check if we have cached data for this window
      const cachedWindowData = this.windowCache.get(windowId);

      if (cachedWindowData) {
        // console.log removed

        // Create closed window record from cached data
        const closedWindow = {
          id: Date.now(), // Use timestamp as unique ID
          closedAt: Date.now(),
          tabCount: cachedWindowData.tabCount,
          domains: cachedWindowData.domains,
          tabs: cachedWindowData.tabs
        };

        // Add to beginning of array (most recent first)
        this.closedWindows.unshift(closedWindow);

        // Limit to 50 most recent closed windows
        this.closedWindows = this.closedWindows.slice(0, 50);

        // Remove from cache since window is closed
        this.windowCache.delete(windowId);

        // Save to localStorage
        this.saveClosedWindows();

        // If windows tab is active, refresh display
        const windowsTab = document.getElementById('windows-tab');
        if (windowsTab && windowsTab.classList.contains('active')) {
          this.displayWindows();
        }

        // console.log removed
        // console.log removed
      } else {
        // console.log removed
      }
    });

    // Track when new windows are created and cache their initial data
    chrome.windows.onCreated.addListener(async (window) => {
      // console.log removed

      try {
        // Get the tabs for this new window
        const tabs = await chrome.tabs.query({ windowId: window.id });
        // console.log removed

        if (tabs.length > 0) {
          const domains = [...new Set(tabs.map(tab => {
            try {
              return new URL(tab.url).hostname;
            } catch {
              return 'Unknown';
            }
          }))];

          // Cache the window data
          this.windowCache.set(window.id, {
            tabCount: tabs.length,
            domains: domains,
            tabs: tabs.map(tab => ({
              url: tab.url,
              title: tab.title || 'Untitled'
            })),
            cachedAt: Date.now()
          });

          // console.log removed
        } else {
          // console.log removed
        }
      } catch (error) {
        console.error(`❌ Error caching new window ${window.id}:`, error);
      }
    });

    // Also track when tabs are updated in existing windows to keep cache current
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.windowId) {
        // Update the cache for this window when tabs change
        this.updateWindowCache(tab.windowId);
      }
    });

    // Track when tabs are removed from windows
    chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
      if (removeInfo.windowId && !removeInfo.isWindowClosing) {
        // Update the cache for this window when tabs are removed
        this.updateWindowCache(removeInfo.windowId);
      }
    });

    // console.log removed
  }

  // Update the cache for a specific window
  async updateWindowCache(windowId) {
    try {
      const tabs = await chrome.tabs.query({ windowId: windowId });

      if (tabs.length > 0) {
        const domains = [...new Set(tabs.map(tab => {
          try {
            return new URL(tab.url).hostname;
          } catch {
            return 'Unknown';
          }
        }))];

        // Update the cache
        this.windowCache.set(windowId, {
          tabCount: tabs.length,
          domains: domains,
          tabs: tabs.map(tab => ({
            url: tab.url,
            title: tab.title || 'Untitled'
          })),
          cachedAt: Date.now()
        });


      }
    } catch (error) {
      console.error(`Error updating cache for window ${windowId}:`, error);
    }
  }

  loadClosedWindows() {
    try {
      const saved = localStorage.getItem('closedWindows');
      if (saved) {
        this.closedWindows = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading closed windows:', error);
      this.closedWindows = [];
    }
  }

  async loadOpenWindows() {
    try {
      const windows = await chrome.windows.getAll({ populate: true });

      this.openWindows = windows.map(window => {
        const windowData = {
          id: window.id,
          isOpen: true,
          tabCount: window.tabs.length,
          domains: [...new Set(window.tabs.map(tab => {
            try {
              return new URL(tab.url).hostname;
            } catch {
              return 'Unknown';
            }
          }))],
          tabs: window.tabs.map(tab => ({
            url: tab.url,
            title: tab.title || 'Untitled'
          })),
          activeTabTitle: window.tabs.find(tab => tab.active)?.title || 'Untitled'
        };

        // Cache the window data for later use when window is closed
        this.windowCache.set(window.id, {
          tabCount: window.tabs.length,
          domains: windowData.domains,
          tabs: windowData.tabs,
          cachedAt: Date.now()
        });

        return windowData;
      });
    } catch (error) {
      console.error('Error loading open windows:', error);
      this.openWindows = [];
    }
  }

  saveClosedWindows() {
    try {
      localStorage.setItem('closedWindows', JSON.stringify(this.closedWindows));
    } catch (error) {
      console.error('Error saving closed windows:', error);
    }
  }

  displayWindows() {
    const windowsList = document.getElementById('windows-list');
    const windowsLoading = document.getElementById('windows-loading');

    windowsLoading.style.display = 'none';

    // Combine and sort all windows (open first, then closed by recency)
    const allWindows = [
      ...this.openWindows.map(w => ({ ...w, isOpen: true })),
      ...this.closedWindows.map(w => ({ ...w, isOpen: false, closedAt: w.closedAt })),
      ...this.chromeSessions.map(w => ({ ...w, isOpen: false, closedAt: w.closedAt }))
    ].sort((a, b) => {
      // Open windows first
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      // Within same type, sort by recency (newest first)
      if (!a.isOpen && !b.isOpen) {
        return b.closedAt - a.closedAt;
      }
      return 0;
    });

    if (allWindows.length === 0) {
      windowsList.innerHTML = '<div class="no-windows">No windows found</div>';
      return;
    }

    let windowsHtml = '';
    allWindows.forEach(window => {
      const domainsText = window.domains.slice(0, 5).join(', ') +
        (window.domains.length > 5 ? ` +${window.domains.length - 5} more` : '');

      const isOpen = window.isOpen;
      const isChromeNative = window.isChromeNative;
      const isPreservedChrome = window.isPreservedChrome;
      const openClass = isOpen ? ' open-window' : '';
      const buttonText = isOpen ? 'Focus' : 'Restore';
      const buttonClass = isOpen ? 'window-focus-btn' : 'window-restore-btn';
      const timestampText = isOpen
        ? ''
        : this.getRelativeTimeString(window.closedAt);

      // No labels - keep it clean and simple

      // Show remove link for custom tracked windows, save link for Chrome sessions
      const canRemove = !isOpen && !isChromeNative && !isPreservedChrome;
      const canSave = !isOpen && (isChromeNative || isPreservedChrome);
      const customClass = canRemove ? ' custom-tracked' : '';
      const removeLinkHtml = canRemove
        ? `<div class="window-remove" data-window-id="${window.id}">Remove</div>`
        : '';
      const saveLinkHtml = canSave
        ? `<div class="window-save" data-window-id="${window.id}" data-chrome-native="${isChromeNative}" data-preserved-chrome="${isPreservedChrome}">Save</div>`
        : '';

      windowsHtml += `
        <div class="window-item${openClass}${customClass}" data-window-id="${window.id}" data-is-open="${isOpen}" data-chrome-native="${isChromeNative}" data-preserved-chrome="${isPreservedChrome}">
          <div class="window-row">
            <div class="window-info">${window.tabCount} tab${window.tabCount !== 1 ? 's' : ''}</div>
            <div class="window-timestamp">${timestampText}</div>
          </div>
          <div class="window-domains-row">
            <div class="window-domains">${domainsText}</div>
            ${removeLinkHtml}${saveLinkHtml}
          </div>
        </div>
      `;
    });

    windowsList.innerHTML = windowsHtml;

    // Add click listeners for window items
    windowsList.querySelectorAll('.window-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        // Don't trigger if clicking on remove link (it has its own handler)
        if (e.target.classList.contains('window-remove')) {
          return;
        }

        const windowId = item.dataset.windowId;
        const isOpen = item.dataset.isOpen === 'true';
        const isChromeNative = item.dataset.chromeNative === 'true';

        if (isOpen) {
          this.focusWindow(parseInt(windowId));
        } else if (isChromeNative) {
          this.restoreChromeSession(windowId);
        } else {
          this.restoreWindow(parseInt(windowId));
        }
      });
    });

    // Add click listeners for remove links
    windowsList.querySelectorAll('.window-remove').forEach(removeLink => {
      removeLink.addEventListener('click', (e) => {
        e.stopPropagation();
        const windowId = removeLink.dataset.windowId;

        // Remove custom tracked window from our storage
        this.closedWindows = this.closedWindows.filter(w => w.id !== parseInt(windowId));
        this.saveClosedWindows();

        // Refresh the display
        this.displayWindows();
      });
    });

    // Add click listeners for save links
    windowsList.querySelectorAll('.window-save').forEach(saveLink => {
      saveLink.addEventListener('click', (e) => {
        e.stopPropagation();
        const windowId = saveLink.dataset.windowId;
        const isChromeNative = saveLink.dataset.chromeNative === 'true';
        const isPreservedChrome = saveLink.dataset.preservedChrome === 'true';

        this.saveChromeSessionToCustom(windowId, isChromeNative, isPreservedChrome);
      });
    });
  }

  async restoreWindow(windowId) {
    const window = this.closedWindows.find(w => w.id === windowId);
    if (!window) {
      console.error('Window not found:', windowId);
      return;
    }

    try {
      // Create new window with first tab
      const firstTab = window.tabs[0];
      const newWindow = await chrome.windows.create({
        url: firstTab.url,
        focused: true
      });

      // Add remaining tabs
      for (let i = 1; i < window.tabs.length; i++) {
        await chrome.tabs.create({
          windowId: newWindow.id,
          url: window.tabs[i].url,
          active: false
        });
      }

      // Remove from closed windows list
      this.closedWindows = this.closedWindows.filter(w => w.id !== windowId);
      this.saveClosedWindows();
      this.displayWindows();


    } catch (error) {
      console.error('Error restoring window:', error);
      alert('Failed to restore window. Please try again.');
    }
  }

  async restoreChromeSession(sessionId) {
    try {
      // Extract the actual session ID from our prefixed ID
      const actualSessionId = sessionId.replace('chrome_session_', '');

      // Use Chrome's native session restoration
      await chrome.sessions.restore(actualSessionId);

      // Refresh the display to remove the restored session
      await this.loadChromeSessions();
      this.displayWindows();

      // console.log removed
    } catch (error) {
      console.error('Error restoring Chrome session:', error);
      alert('Failed to restore Chrome session. It may have expired.');
    }
  }

  async focusWindow(windowId) {
    try {
      await chrome.windows.update(windowId, { focused: true });

    } catch (error) {
      console.error('Error focusing window:', error);
      alert('Failed to focus window. It may have been closed.');
    }
  }



  // Load Chrome's native recently closed sessions
  async loadChromeSessions() {
    try {
      // Check if chrome.sessions API is available
      if (!chrome.sessions || !chrome.sessions.getRecentlyClosed) {
        // console.log removed
        this.chromeSessions = [];
        return;
      }

      // Get recently closed sessions from Chrome
      const sessions = await chrome.sessions.getRecentlyClosed({ maxResults: 25 });

      this.chromeSessions = sessions.map(session => {
        if (session.window) {
          // This is a closed window
          const sessionData = {
            id: 'chrome_session_' + session.window.sessionId,
            isChromeNative: true,
            isOpen: false,
            closedAt: session.lastModified * 1000, // Convert to milliseconds
            tabCount: session.window.tabs.length,
            domains: [...new Set(session.window.tabs.map(tab => {
              try {
                return new URL(tab.url).hostname;
              } catch {
                return 'Unknown';
              }
            }))],
            tabs: session.window.tabs.map(tab => ({
              url: tab.url,
              title: tab.title || 'Untitled'
            })),
            sessionId: session.window.sessionId // For restoration
          };

          // Preserve this Chrome session in our localStorage for long-term storage
          this.preserveChromeSession(sessionData);

          return sessionData;
        }
        return null;
      }).filter(session => session !== null);

      // Also load any previously preserved Chrome sessions from localStorage
      const preservedSessions = this.loadPreservedChromeSessions();

      // Merge fresh and preserved Chrome sessions, avoiding duplicates
      const allChromeSessions = [...this.chromeSessions];

      // Add preserved sessions that aren't already in fresh sessions
      for (const preserved of preservedSessions) {
        const exists = this.chromeSessions.some(fresh => fresh.sessionId === preserved.sessionId);
        if (!exists) {
          // Mark as preserved (not fresh from Chrome)
          preserved.isPreservedChrome = true;
          preserved.isChromeNative = false; // Don't show as fresh Chrome native
          allChromeSessions.push(preserved);
        }
      }

      // Sort by recency (most recent first)
      allChromeSessions.sort((a, b) => b.closedAt - a.closedAt);

      // Limit to 25 Chrome sessions total
      this.chromeSessions = allChromeSessions.slice(0, 25);


    } catch (error) {
      console.error('❌ Error loading Chrome sessions:', error);
      // Fallback to preserved sessions only
      this.chromeSessions = this.loadPreservedChromeSessions();
      // console.log removed
    }
  }

  // Preserve a Chrome session in localStorage for long-term retention
  preserveChromeSession(sessionData, removeSessionId = null) {
    try {
      const preservedSessions = this.loadPreservedChromeSessions();

      if (removeSessionId) {
        // Remove the session
        const filteredSessions = preservedSessions.filter(s => s.sessionId !== removeSessionId);
        localStorage.setItem('preservedChromeSessions', JSON.stringify(filteredSessions));
        return;
      }

      if (!sessionData) return;

      // Check if we already have this session
      const existingIndex = preservedSessions.findIndex(s => s.sessionId === sessionData.sessionId);

      if (existingIndex >= 0) {
        // Update existing session
        preservedSessions[existingIndex] = sessionData;
      } else {
        // Add new session
        preservedSessions.unshift(sessionData);
      }

      // Keep only the most recent 25 preserved sessions
      const limitedSessions = preservedSessions.slice(0, 25);

      localStorage.setItem('preservedChromeSessions', JSON.stringify(limitedSessions));

    } catch (error) {
      console.error('Error preserving Chrome session:', error);
    }
  }

  // Load preserved Chrome sessions from localStorage
  loadPreservedChromeSessions() {
    try {
      const saved = localStorage.getItem('preservedChromeSessions');
      if (saved) {
        const sessions = JSON.parse(saved);
        return sessions;
      }
    } catch (error) {
      console.error('Error loading preserved Chrome sessions:', error);
    }
    return [];
  }

  // Clear all preserved Chrome sessions
  clearPreservedChromeSessions() {
    try {
      localStorage.removeItem('preservedChromeSessions');
      // console.log removed
    } catch (error) {
      console.error('Error clearing preserved Chrome sessions:', error);
    }
  }



  // Clean up old cache entries (older than 1 hour)
  cleanupWindowCache() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    for (const [windowId, data] of this.windowCache.entries()) {
      if (data.cachedAt < oneHourAgo) {
        this.windowCache.delete(windowId);
      }
    }
  }

  setupTimeRangeListener() {
    const timeRangeSelect = document.getElementById('time-range');
    if (timeRangeSelect) {
      // Remove any existing listener to prevent duplicates
      const newTimeRangeSelect = timeRangeSelect.cloneNode(true);
      timeRangeSelect.parentNode.replaceChild(newTimeRangeSelect, timeRangeSelect);
      
      newTimeRangeSelect.addEventListener('change', (e) => {
        // Save the selected time range
        localStorage.setItem('historyFilterTimeRange', e.target.value);
        this.loadHistory(e.target.value).then(() => {
          this.applyFilters();
        });
      });
    }
  }

  setupFilterListener(filterId) {
    const input = document.querySelector(`input[data-filter-id="${filterId}"]`);
    if (input) {
      input.addEventListener('input', (e) => {
        this.updateFilter(filterId, e.target.value);
        this.applyFilters();
      });
    }

    const operatorSelect = document.querySelector(`select[data-filter-id="${filterId}"].operator-select`);
    if (operatorSelect) {
      operatorSelect.addEventListener('change', (e) => {
        this.updateOperator(filterId, e.target.value);
        this.applyFilters();
      });
    }

    const searchFieldSelect = document.querySelector(`select[data-filter-id="${filterId}"].search-field-select`);
    if (searchFieldSelect) {
      searchFieldSelect.addEventListener('change', (e) => {
        this.updateSearchField(filterId, e.target.value);
        this.applyFilters();
      });
    }
  }

  addFilter() {
    this.filterId++;
    const newFilter = { id: this.filterId, value: '', operator: 'include', searchField: 'url' };
    this.filters.push(newFilter);

    this.createFilterRow(newFilter);
    this.saveFilters();
  }

  removeFilter(filterId, element) {
    this.filters = this.filters.filter(f => f.id !== filterId);
    element.remove();
    this.saveFilters();
    this.updateClearButtonVisibility();
    this.applyFilters();
  }


  updateFilter(filterId, value) {
    const filter = this.filters.find(f => f.id === filterId);
    if (filter) {
      filter.value = value;
      this.saveFilters();
      this.updateClearButtonVisibility();
    }
  }

  updateOperator(filterId, operator) {
    const filter = this.filters.find(f => f.id === filterId);
    if (filter) {
      filter.operator = operator;
      this.saveFilters();
    }
  }

  updateSearchField(filterId, searchField) {
    const filter = this.filters.find(f => f.id === filterId);
    if (filter) {
      filter.searchField = searchField;
      this.saveFilters();
    }
  }

  applyFilters() {
    const activeFilters = this.filters.filter(f => f.value.trim() !== '');

    if (activeFilters.length === 0) {
      this.displayResults([]);
      return;
    }

    let filteredItems = this.historyItems;

    for (let i = 0; i < activeFilters.length; i++) {
      const filter = activeFilters[i];
      const filterValue = filter.value.toLowerCase();
      
      // console.log removed
      
      if (i === 0) {
        filteredItems = filteredItems.filter(item => {
          if (filter.searchField === 'title') {
            const title = (item.title || '').toLowerCase();
            return title.includes(filterValue);
          } else {
            const url = item.url.toLowerCase();
            return url.includes(filterValue);
          }
        });

      } else {
        if (filter.operator === 'include') {
          filteredItems = filteredItems.filter(item => {
            if (filter.searchField === 'title') {
              const title = (item.title || '').toLowerCase();
              return title.includes(filterValue);
            } else {
              const url = item.url.toLowerCase();
              return url.includes(filterValue);
            }
          });
          // console.log removed
        } else if (filter.operator === 'exclude') {
          filteredItems = filteredItems.filter(item => {
            if (filter.searchField === 'title') {
              const title = (item.title || '').toLowerCase();
              return !title.includes(filterValue);
            } else {
              const url = item.url.toLowerCase();
              return !url.includes(filterValue);
            }
          });

        }
      }
    }

    filteredItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
    this.displayResults(filteredItems);
  }

  showMoreResults() {
    const nextBatch = Math.min(this.displayedCount + 100, this.currentFilteredItems.length);
    this.displayedCount = nextBatch;
    this.displayResults(this.currentFilteredItems, true);
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  async openAllInNewWindow() {
    if (this.currentFilteredItems.length === 0) {
      return;
    }

    try {
      const urls = this.currentFilteredItems.slice(0, 100).map(item => item.url);
      
      const newWindow = await chrome.windows.create({
        url: urls[0],
        focused: true
      });

      for (let i = 1; i < urls.length; i++) {
        await chrome.tabs.create({
          windowId: newWindow.id,
          url: urls[i],
          active: false
        });
      }
    } catch (error) {
      console.error('Error opening tabs:', error);
    }
  }

  saveFilters() {
    const filterData = {
      filters: this.filters,
      nextId: this.filterId
    };
    localStorage.setItem('historyFilterState', JSON.stringify(filterData));
  }

  loadSavedFilters() {
    try {
      const saved = localStorage.getItem('historyFilterState');
      if (saved) {
        const filterData = JSON.parse(saved);
        this.filters = filterData.filters || [{ id: 0, value: '', operator: 'include', searchField: 'url' }];
        this.filterId = filterData.nextId || 0;
        
        // Add searchField for backward compatibility
        this.filters.forEach(filter => {
          if (!filter.searchField) {
            filter.searchField = 'url';
          }
        });
        
        // Recreate filter UI
        const filtersContainer = document.getElementById('filters-list');
        filtersContainer.innerHTML = '';
        
        this.filters.forEach(filter => {
          this.createFilterRow(filter);
        });
        
        // Re-setup time range listener after DOM is recreated
        this.setupTimeRangeListener();
        
        this.updateClearButtonVisibility();
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
      // Fallback to default
      this.filters = [{ id: 0, value: '', operator: 'include', searchField: 'url' }];
      this.filterId = 0;
    }
  }

  clearAllFilters() {
    // Reset to single empty filter
    this.filters = [{ id: 0, value: '', operator: 'include', searchField: 'url' }];
    this.filterId = 0;
    
    // Clear localStorage
    localStorage.removeItem('historyFilterState');
    
    // Recreate UI
    const filtersContainer = document.getElementById('filters-list');
    filtersContainer.innerHTML = '';
    this.createFilterRow(this.filters[0]);
    
    // Re-setup time range listener after DOM is recreated
    this.setupTimeRangeListener();
    
    // Update visibility and apply filters
    this.updateClearButtonVisibility();
    this.applyFilters();
  }

  updateClearButtonVisibility() {
    const clearBtn = document.getElementById('clear-filters');
    const hasActiveFilters = this.filters.some(f => f.value.trim() !== '') || this.filters.length > 1;
    clearBtn.style.display = hasActiveFilters ? 'block' : 'none';
  }

  createFilterRow(filter) {
    const filtersContainer = document.getElementById('filters-list');
    const filterRow = document.createElement('div');
    filterRow.className = 'filter-row';
    
    if (filter.id === 0) {
      // First filter (search field dropdown, filter input, time range)
      const savedTimeRange = localStorage.getItem('historyFilterTimeRange') || 'week';
      filterRow.innerHTML = `
        <select class="search-field-select" data-filter-id="${filter.id}">
          <option value="url" ${filter.searchField === 'url' ? 'selected' : ''}>URL</option>
          <option value="title" ${filter.searchField === 'title' ? 'selected' : ''}>Title</option>
        </select>
        <input type="text" class="filter-input" placeholder="Enter search text..." data-filter-id="${filter.id}" value="${filter.value}">
        <select class="operator-select" data-filter-id="${filter.id}" style="display: none;">
          <option value="include">Include</option>
          <option value="exclude">Exclude</option>
        </select>
        <select class="time-range-select" id="time-range">
          <option value="48hours" ${savedTimeRange === '48hours' ? 'selected' : ''}>Past 48 hours</option>
          <option value="week" ${savedTimeRange === 'week' ? 'selected' : ''}>Past week</option>
          <option value="month" ${savedTimeRange === 'month' ? 'selected' : ''}>Past month</option>
          <option value="year" ${savedTimeRange === 'year' ? 'selected' : ''}>Past year</option>
        </select>
      `;
    } else {
      // Additional filters (search field dropdown, operator dropdown, filter input, remove button)
      filterRow.innerHTML = `
        <select class="search-field-select" data-filter-id="${filter.id}">
          <option value="url" ${filter.searchField === 'url' ? 'selected' : ''}>URL</option>
          <option value="title" ${filter.searchField === 'title' ? 'selected' : ''}>Title</option>
        </select>
        <select class="operator-select" data-filter-id="${filter.id}">
          <option value="include" ${filter.operator === 'include' ? 'selected' : ''}>Include</option>
          <option value="exclude" ${filter.operator === 'exclude' ? 'selected' : ''}>Exclude</option>
        </select>
        <input type="text" class="filter-input" placeholder="Enter search text..." data-filter-id="${filter.id}" value="${filter.value}">
        <button class="btn-secondary btn-secondary-icon" data-filter-id="${filter.id}">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;
    }

    filtersContainer.appendChild(filterRow);
    this.setupFilterListener(filter.id);

    if (filter.id !== 0) {
      const removeBtn = filterRow.querySelector('.btn-secondary-icon');
      removeBtn.addEventListener('click', () => this.removeFilter(filter.id, filterRow));
    }
  }

  highlightMatches(text, searchTerms) {
    // Remove any existing highlight tags first to prevent nested highlights
    let cleanText = text.replace(/<span class="highlight">(.*?)<\/span>/gi, '$1');
    
    // Create a single regex pattern for all search terms
    const validTerms = searchTerms.filter(term => term.trim());
    if (validTerms.length === 0) {
      return cleanText;
    }
    
    // Escape special regex characters and create alternation pattern
    const escapedTerms = validTerms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const combinedPattern = `(${escapedTerms.join('|')})`;
    const regex = new RegExp(combinedPattern, 'gi');
    
    return cleanText.replace(regex, '<span class="highlight">$1</span>');
  }

  getTimeGroupLabel(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
    const lastWeekStart = new Date(thisWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (itemDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (itemDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (itemDate >= thisWeekStart) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (itemDate >= lastWeekStart) {
      return 'Last Week';
    } else if (itemDate >= thisMonthStart) {
      return 'Earlier This Month';
    } else if (itemDate >= lastMonthStart) {
      return 'Last Month';
    } else {
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

  getRelativeTimeString(timestamp) {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);

    // Less than 1 minute
    if (diffMins < 1) {
      return 'Just now';
    }
    // Less than 1 hour
    else if (diffMins < 60) {
      return diffMins === 1 ? '1 min ago' : `${diffMins} mins ago`;
    }
    // Less than 24 hours
    else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    // Less than 7 days
    else if (diffDays < 7) {
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    }
    // Less than 30 days
    else if (diffDays < 30) {
      if (diffWeeks === 1) return 'Last week';
      return `${diffWeeks} weeks ago`;
    }
    // More than 30 days - show actual date
    else {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    }
  }

  displayResults(items, append = false) {
    const resultsContainer = document.getElementById('results-list');
    const loadingDiv = document.getElementById('loading');
    const resultsHeader = document.getElementById('results-header');
    const resultsCount = document.getElementById('results-count');
    
    if (!append) {
      this.currentFilteredItems = items;
      this.displayedCount = Math.min(100, items.length);
      loadingDiv.style.display = 'none';
      
      if (items.length === 0) {
        resultsHeader.style.display = 'none';
        resultsContainer.innerHTML = '<div class="no-results">No matching history items found</div>';
        return;
      }

      resultsHeader.style.display = 'flex';
      resultsCount.textContent = `${items.length} result${items.length !== 1 ? 's' : ''}`;
    }

    // Get active filter terms separated by search field for highlighting
    const activeFilters = this.filters.filter(f => f.value.trim() !== '');
    const urlSearchTerms = activeFilters.filter(f => f.searchField === 'url').map(f => f.value.trim());
    const titleSearchTerms = activeFilters.filter(f => f.searchField === 'title').map(f => f.value.trim());

    // Group items by time periods
    const groupedItems = {};
    const displayItems = items.slice(0, this.displayedCount);
    
    displayItems.forEach(item => {
      const groupLabel = this.getTimeGroupLabel(item.lastVisitTime);
      if (!groupedItems[groupLabel]) {
        groupedItems[groupLabel] = [];
      }
      groupedItems[groupLabel].push(item);
    });

    // Define group order
    const groupOrder = ['Today', 'Yesterday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Last Week', 'Earlier This Month', 'Last Month'];
    
    let resultsHtml = '';
    Object.keys(groupedItems).forEach(groupLabel => {
      // Add date group header
      resultsHtml += `<div class="date-group-header">${groupLabel}</div>`;
      
      // Add items in this group
      groupedItems[groupLabel].forEach(item => {
        const highlightedUrl = this.highlightMatches(item.url, urlSearchTerms);
        const showTitles = document.getElementById('show-titles').checked;
        const highlightedTitle = showTitles && item.title ? this.highlightMatches(item.title, titleSearchTerms) : '';
        const titleHtml = showTitles && item.title ? `<div class="result-title">${highlightedTitle}</div>` : '';
        
        // Check if this URL is currently open in a tab
        const isOpenInTab = this.openTabsMap && this.openTabsMap.has(item.url);
        const openTabClass = isOpenInTab ? ' open-in-tab' : '';
        const tabId = isOpenInTab ? this.openTabsMap.get(item.url) : null;
        
        resultsHtml += `
          <div class="result-item${openTabClass}" data-url="${item.url}" ${tabId ? `data-tab-id="${tabId}"` : ''}>
            ${titleHtml}
            <a href="${item.url}" class="result-url" ${isOpenInTab ? '' : 'target="_blank"'} title="${item.url}">
              ${highlightedUrl}
            </a>
          </div>
        `;
      });
    });

    // Add pagination if there are more results
    if (items.length > this.displayedCount) {
      const remaining = items.length - this.displayedCount;
      resultsHtml += `
        <div class="pagination">
          Showing ${this.displayedCount}/${items.length} results
          <a href="#" class="show-more-link" id="show-more-link">Show more</a>
        </div>
      `;
    }

    resultsContainer.innerHTML = resultsHtml;
    
    // Add click listeners for result items
    resultsContainer.querySelectorAll('.result-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const tabId = item.dataset.tabId;
        const url = item.dataset.url;
        
        if (tabId) {
          // Switch to existing tab
          try {
            await chrome.tabs.update(parseInt(tabId), { active: true });
            // Bring the window to focus
            const tab = await chrome.tabs.get(parseInt(tabId));
            await chrome.windows.update(tab.windowId, { focused: true });
          } catch (error) {
            console.error('Error switching to tab:', error);
            // Fallback: open in new tab if switching fails
            chrome.tabs.create({ url: url });
          }
        } else {
          // Open in new tab
          chrome.tabs.create({ url: url });
        }
      });
    });
    
    // Add show more event listener
    const showMoreLink = document.getElementById('show-more-link');
    if (showMoreLink) {
      showMoreLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showMoreResults();
      });
    }
  }

  // Save a Chrome session to our custom storage
  saveChromeSessionToCustom(windowId, isChromeNative, isPreservedChrome) {
    // Find the session in chromeSessions array
    const sessionIndex = this.chromeSessions.findIndex(w => w.id === windowId);
    if (sessionIndex === -1) {
      console.error('Chrome session not found:', windowId);
      return;
    }

    const session = this.chromeSessions[sessionIndex];

    // Create a custom tracked window record
    const customWindow = {
      id: Date.now(), // Use timestamp as unique ID for our custom storage
      closedAt: session.closedAt,
      tabCount: session.tabCount,
      domains: session.domains,
      tabs: session.tabs
    };

    // Add to our custom storage
    this.closedWindows.unshift(customWindow);

    // Limit to 50 most recent custom windows
    this.closedWindows = this.closedWindows.slice(0, 50);

    // Remove from Chrome sessions array
    this.chromeSessions.splice(sessionIndex, 1);

    // If it was a preserved Chrome session, also remove from preserved storage
    if (isPreservedChrome) {
      this.preserveChromeSession(null, session.sessionId);
    }

    // Save our custom data
    this.saveClosedWindows();

    // Refresh the display to show the saved window with green edge
    this.displayWindows();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HistoryFilter();
});
