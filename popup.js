class HistoryFilter {
  constructor() {
    this.filters = [{ id: 0, value: '', operator: 'include' }];
    this.filterId = 0;
    this.historyItems = [];
    this.currentFilteredItems = [];
    this.init();
  }

  init() {
    // Load saved time range or default to 'week'
    const savedTimeRange = localStorage.getItem('historyFilterTimeRange') || 'week';
    document.getElementById('time-range').value = savedTimeRange;
    
    // Load saved show titles preference (default to true)
    const savedShowTitles = localStorage.getItem('historyFilterShowTitles');
    const showTitles = savedShowTitles !== null ? JSON.parse(savedShowTitles) : true;
    document.getElementById('show-titles').checked = showTitles;
    
    // Load saved filters
    this.loadSavedFilters();
    
    this.loadHistory(savedTimeRange).then(() => {
      // Apply saved filters after history is loaded
      this.applyFilters();
    });
    this.setupEventListeners();
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
      console.log(`Loaded ${this.historyItems.length} history items (${timeRange})`);
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

    const openAllBtn = document.getElementById('open-all-btn');
    openAllBtn.addEventListener('click', () => this.openAllInNewWindow());

    const timeRangeSelect = document.getElementById('time-range');
    timeRangeSelect.addEventListener('change', (e) => {
      // Save the selected time range
      localStorage.setItem('historyFilterTimeRange', e.target.value);
      this.loadHistory(e.target.value).then(() => {
        this.applyFilters();
      });
    });

    this.setupFilterListener(0);
  }

  setupFilterListener(filterId) {
    const input = document.querySelector(`input[data-filter-id="${filterId}"]`);
    if (input) {
      input.addEventListener('input', (e) => {
        this.updateFilter(filterId, e.target.value);
        this.applyFilters();
      });
    }

    const select = document.querySelector(`select[data-filter-id="${filterId}"]`);
    if (select) {
      select.addEventListener('change', (e) => {
        this.updateOperator(filterId, e.target.value);
        this.applyFilters();
      });
    }
  }

  addFilter() {
    this.filterId++;
    const newFilter = { id: this.filterId, value: '', operator: 'include' };
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
      
      console.log(`Filter ${i}: "${filterValue}", operator: "${filter.operator}", current results: ${filteredItems.length}`);
      
      if (i === 0) {
        filteredItems = this.historyItems.filter(item => {
          const url = item.url.toLowerCase();
          return url.includes(filterValue);
        });
        console.log(`After base filter ${i}: ${filteredItems.length} results`);
      } else {
        if (filter.operator === 'include') {
          filteredItems = filteredItems.filter(item => {
            const url = item.url.toLowerCase();
            return url.includes(filterValue);
          });
          console.log(`After INCLUDE filter ${i}: ${filteredItems.length} results`);
        } else if (filter.operator === 'exclude') {
          filteredItems = filteredItems.filter(item => {
            const url = item.url.toLowerCase();
            return !url.includes(filterValue);
          });
          console.log(`After EXCLUDE filter ${i}: ${filteredItems.length} results`);
        }
      }
    }

    filteredItems.sort((a, b) => b.lastVisitTime - a.lastVisitTime);
    this.displayResults(filteredItems);
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

      window.close();
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
        this.filters = filterData.filters || [{ id: 0, value: '', operator: 'include' }];
        this.filterId = filterData.nextId || 0;
        
        // Recreate filter UI
        const filtersContainer = document.getElementById('filters-list');
        filtersContainer.innerHTML = '';
        
        this.filters.forEach(filter => {
          this.createFilterRow(filter);
        });
        
        this.updateClearButtonVisibility();
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
      // Fallback to default
      this.filters = [{ id: 0, value: '', operator: 'include' }];
      this.filterId = 0;
    }
  }

  clearAllFilters() {
    // Reset to single empty filter
    this.filters = [{ id: 0, value: '', operator: 'include' }];
    this.filterId = 0;
    
    // Clear localStorage
    localStorage.removeItem('historyFilterState');
    
    // Recreate UI
    const filtersContainer = document.getElementById('filters-list');
    filtersContainer.innerHTML = '';
    this.createFilterRow(this.filters[0]);
    
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
      // First filter (no operator dropdown, has time range)
      const savedTimeRange = localStorage.getItem('historyFilterTimeRange') || 'week';
      filterRow.innerHTML = `
        <input type="text" class="filter-input" placeholder="Enter domain or URL text..." data-filter-id="${filter.id}" value="${filter.value}">
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
      // Additional filters
      filterRow.innerHTML = `
        <select class="operator-select" data-filter-id="${filter.id}">
          <option value="include" ${filter.operator === 'include' ? 'selected' : ''}>Include</option>
          <option value="exclude" ${filter.operator === 'exclude' ? 'selected' : ''}>Exclude</option>
        </select>
        <input type="text" class="filter-input" placeholder="Enter domain or URL text..." data-filter-id="${filter.id}" value="${filter.value}">
        <button class="remove-filter" data-filter-id="${filter.id}">Remove</button>
      `;
    }

    filtersContainer.appendChild(filterRow);
    this.setupFilterListener(filter.id);

    if (filter.id !== 0) {
      const removeBtn = filterRow.querySelector('.remove-filter');
      removeBtn.addEventListener('click', () => this.removeFilter(filter.id, filterRow));
    }
  }

  highlightMatches(text, searchTerms) {
    let highlightedText = text;
    searchTerms.forEach(term => {
      if (term.trim()) {
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = highlightedText.replace(regex, '<span class="highlight">$1</span>');
      }
    });
    return highlightedText;
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

  displayResults(items) {
    const resultsContainer = document.getElementById('results-list');
    const loadingDiv = document.getElementById('loading');
    const resultsHeader = document.getElementById('results-header');
    const resultsCount = document.getElementById('results-count');
    
    this.currentFilteredItems = items;
    loadingDiv.style.display = 'none';
    
    if (items.length === 0) {
      resultsHeader.style.display = 'none';
      resultsContainer.innerHTML = '<div class="no-results">No matching history items found</div>';
      return;
    }

    resultsHeader.style.display = 'flex';
    resultsCount.textContent = `${items.length} result${items.length !== 1 ? 's' : ''}`;

    // Get all active filter terms for highlighting
    const activeFilters = this.filters.filter(f => f.value.trim() !== '');
    const searchTerms = activeFilters.map(f => f.value.trim());

    // Group items by time periods
    const groupedItems = {};
    const displayItems = items.slice(0, 100);
    
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
        const highlightedUrl = this.highlightMatches(item.url, searchTerms);
        const showTitles = document.getElementById('show-titles').checked;
        const titleHtml = showTitles && item.title ? `<div class="result-title">${item.title}</div>` : '';
        
        resultsHtml += `
          <div class="result-item">
            ${titleHtml}
            <a href="${item.url}" class="result-url" target="_blank" title="${item.url}">
              ${highlightedUrl}
            </a>
          </div>
        `;
      });
    });

    resultsContainer.innerHTML = resultsHtml;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HistoryFilter();
});