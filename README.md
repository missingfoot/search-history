# Search History

A powerful Chrome extension for searching and filtering your browser history with advanced criteria and bulk actions.

## Features

### 🔍 Advanced Filtering
- **Stacked Filters**: Add multiple filter criteria that work together
- **Include/Exclude Logic**: Each filter can include or exclude text matches
- **Live Search**: Results update as you type
- **Search Field Selection**: Choose to search in URLs or page titles for each filter
- **Mixed Search Types**: Combine URL and title filters in the same search

### ⏰ Time Range Control
- **Past 48 hours** - Recent browsing
- **Past week** - Default setting  
- **Past month** - Extended recent history
- **Past year** - Long-term history search

### 📅 Smart Date Grouping
Results are automatically organized by time periods:
- Today
- Yesterday  
- Individual weekdays (Monday, Tuesday, etc.)
- Last Week
- Earlier This Month
- Last Month
- Specific months (October 2024, September 2024, etc.)

### 🎨 Visual Features
- **Search Highlighting**: Matching text is subtly underlined in URLs and titles
- **Page Titles**: Toggle to show/hide page titles above URLs
- **Open Tab Indicators**: Blue edge flags show which history items are currently open in tabs
- **Dark/Light Theme**: Automatically follows your system theme
- **Clean Interface**: Compact design with smooth scrolling
- **No Horizontal Overflow**: Long URLs wrap properly

### ⚡ Smart Navigation
- **Open All in New Window**: Open all filtered results as tabs in a new window
- **Smart Tab Switching**: Click items already open in tabs to switch to them instead of creating duplicates
- **Tab Management**: Automatically focuses the correct browser window when switching tabs
- **Smart Limits**: Automatically limits bulk operations to 100 URLs to prevent browser overload

### 💾 Persistent State
The extension remembers your preferences:
- Last selected time range
- All filter text, Include/Exclude settings, and URL/Title field selections
- Show/hide titles preference
- Show only open tabs preference
- Number of active filters

### 🧹 Easy Management
- **Clear Filters**: One-click button to reset all filters (appears when needed)
- **Remove Individual Filters**: Remove specific filters with dedicated buttons
- **Tab-Only View**: Toggle to show only history items that are currently open in tabs
- **Smart UI**: Clear button only shows when you have active filters

## How to Use

### Basic Search
1. Click the extension icon
2. Choose search field: **URL** or **Title** from the dropdown
3. Type in the search box (e.g., "youtube.com" for URL or "tutorial" for Title)
4. See filtered results organized by date

### Advanced Filtering
1. Add additional filters with "Add Filter" button
2. For each filter, choose:
   - **Search Field**: URL or Title
   - **Logic**: Include or Exclude
   - **Search Text**: The text to match
3. Stack multiple criteria for precise results

### Example Workflows

**Find recent social media visits:**
- Filter 1: URL → "twitter.com" (Include)
- Time range: "Past week"

**Find YouTube videos but not ads:**
- Filter 1: URL → "youtube.com" (Include)  
- Filter 2: URL → "ads" (Exclude)

**Find React tutorials:**
- Filter 1: Title → "react" (Include)
- Filter 2: Title → "tutorial" (Include)

**Research from specific site:**
- Filter 1: URL → "github.com" (Include)
- Filter 2: Title → "typescript" (Include)
- Time range: "Past month"

**Manage open tabs:**
- Check "Show only open tabs" to see which history items are currently open
- Click blue-flagged items to switch to existing tabs instead of opening new ones

### Bulk Operations
1. Filter to your desired results
2. Click "Open in a new window" to open all URLs as tabs
3. Extension automatically closes after opening tabs

## Installation

1. Download or clone this repository
2. Open Chrome → Extensions → Developer mode ON
3. Click "Load unpacked" and select the extension folder
4. The extension icon will appear in your toolbar

## Technical Details

- **Manifest Version**: 3
- **Permissions**: History access, tab management, active tab detection
- **Storage**: Uses localStorage for preferences and filter persistence
- **Theme Support**: CSS variables with system theme detection
- **Performance**: Efficient filtering with up to 100,000 history items
- **Search Types**: Dual-mode searching in URLs and page titles
- **Tab Integration**: Real-time open tab detection and smart navigation

## Privacy

- **Local Only**: All data processing happens locally in your browser
- **No Network**: Extension doesn't send any data to external servers
- **Chrome APIs**: Uses only standard Chrome extension APIs for history access

---

**Version**: 1.0  
**Compatibility**: Chrome (Manifest V3)