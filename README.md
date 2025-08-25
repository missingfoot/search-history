# Search History & Tab Manager

A powerful Chrome extension for searching and filtering your browser history, managing open tabs, and restoring closed windows with advanced features and intuitive organization.

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
- **Active Tab Memory**: Remembers which tab you were last viewing
- Last selected time range (History tab)
- All filter text, Include/Exclude settings, and URL/Title field selections
- Show/hide titles preference (History tab)
- Filter preferences for both History and Tabs tabs
- Number of active filters

### 🧹 Easy Management
- **Clear Filters**: One-click button to reset all filters (appears when needed)
- **Remove Individual Filters**: Remove specific filters with dedicated buttons
- **Smart UI**: Clear button only shows when you have active filters
- **Dedicated Tabs Section**: Complete tab management in separate, optimized interface

### 🪟 Window Management Hub
- **Complete Window Overview**: See all currently open windows and recently closed windows in one place
- **Chrome Native Integration**: Access Chrome's built-in recently closed sessions alongside custom tracking
- **Session Preservation**: Automatically saves Chrome's sessions to localStorage when loaded to prevent data loss
- **Visual Distinction**: Open windows (blue edge), Chrome native (green + [CHROME]), preserved (green + [SAVED]), custom (no edge)
- **Triple Tracking System**: Fresh Chrome sessions + preserved Chrome sessions + custom persistent tracking
- **Automatic Tracking**: Extension automatically tracks when you close windows using multiple methods
- **Persistent Storage**: All closed windows are saved locally and persist across browser sessions and restarts
- **Quick Identification**: See tab count, domains, and status for each window with clear source indicators
- **Smart Actions**: Focus open windows or restore closed ones with one click (uses appropriate restoration method)
- **Smart Limits**: Keeps 25 Chrome sessions + 50 custom closed windows for optimal performance
- **Domain Preview**: Comma-separated list of domains helps you identify the right window quickly
- **Relative Timestamps**: Human-readable time display (e.g., "5 mins ago", "Yesterday", "Last week", "25 Aug")

### 📑 Complete Tab Management
- **All Open Tabs View**: See all tabs from all windows organized by parent window
- **Tab Search & Filtering**: Full search/filtering capabilities for open tabs (same as history)
- **Window-Based Organization**: Tabs grouped by browser window with sticky headers
- **Instant Tab Switching**: Click any tab to switch to it instantly (focuses correct window)
- **Active Tab Indicators**: Visual indicators for currently active tabs
- **Sticky Window Headers**: Window headers stick to top while scrolling for easy navigation
- **No Time Filtering**: Optimized for current tabs (no date ranges needed)
- **Smart Defaults**: Title search by default for more intuitive tab finding
- **Complete Overview**: See all your open tabs in one organized view

### 🎯 Intelligent Interface
- **Tab Memory**: Extension remembers and restores your last active tab
- **Contextual Controls**: Clear filters button only appears when you have active filters
- **Streamlined Design**: Removed unnecessary controls for cleaner experience
- **Smart Separation**: History (past) vs Tabs (present) clearly separated
- **Adaptive UI**: Interface adapts based on what you're doing

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
- Switch to the **"Tabs"** tab for complete open tab management
- Use the same search and filtering as history for finding specific tabs
- Click any tab to switch to it instantly
- See all tabs organized by their parent browser window

### Bulk Operations
1. Filter to your desired results
2. Click "Open in a new window" to open all URLs as tabs
3. Extension automatically closes after opening tabs

### Window Management
1. Click the extension icon and switch to the **"Windows"** tab
2. **Open Windows** (with blue accent edge):
   - See all your currently open browser windows
   - Shows active tab title and tab count
   - Click **"Focus"** to switch to that window
3. **Chrome Native Sessions** (with green accent edge and [CHROME] label):
   - Fresh recently closed windows from Chrome's built-in tracking (when available)
   - Most up-to-date and reliable for very recent closures
   - Click **"Restore"** to use Chrome's native restoration method
   - May not appear if Chrome sessions API is unavailable
4. **Preserved Chrome Sessions** (with green accent edge and [SAVED] label):
   - Chrome sessions that we've saved to localStorage for long-term retention
   - These persist even after Chrome drops them from its native list
   - Automatically preserved when Chrome's sessions are loaded
5. **Custom Closed Windows** (no accent edge):
   - Windows tracked by our extension for maximum persistence
   - Survive browser restarts and work across devices (with sync)
   - Click **"Restore"** to reopen with all tabs
   - Use **"Clear All"** to remove all stored custom closed windows
6. All window types are automatically tracked when you close them (no manual action needed)

**Window Management Examples:**

**Switch between work sessions:**
- See all open windows with blue edges: "12 tabs - Active 'Jira Dashboard'"
- Click "Focus" to switch to your work window instantly

**Lost a research session:**
- Find closed window: "8 tabs - Closed 5 mins ago - google.com, stackoverflow.com, github.com, ..."
- Click "Restore" to get back all your research tabs

**Review recent activity:**
- Chrome sessions: "15 tabs - Closed 2 hours ago - youtube.com, twitter.com, reddit.com"
- Your custom: "6 tabs - Closed Yesterday - github.com, stackoverflow.com"
- Old sessions: "10 tabs - Closed 25 Aug - various research sites"

**Quick window overview:**
- Get a complete picture of all your browser windows in one glance
- Easily identify which window contains specific websites by the domain preview

### Tab Management
1. Click the extension icon and switch to the **"Tabs"** tab
2. **View All Open Tabs**:
   - See every tab from all your browser windows
   - Organized by parent window with sticky headers
   - Active tabs are highlighted with blue accent
3. **Search & Filter Tabs**:
   - Use the same powerful filtering as history
   - Search by URL or Title (Title is default for better usability)
   - Add multiple filters with Include/Exclude logic
   - Clear filters button only appears when needed
4. **Navigate Between Tabs**:
   - Click any tab to switch to it instantly
   - Extension focuses the correct browser window automatically
   - No duplicate tabs created - switches to existing ones
5. **Window Organization**:
   - Tabs grouped under window headers (e.g., "Window: YouTube - Main")
   - Sticky headers stay visible while scrolling
   - Easy to see which tabs belong to which window

**Tab Management Examples:**

**Find a specific research tab:**
- Filter by Title: "machine learning"
- See all matching tabs across all windows
- Click to jump directly to the tab

**Organize your browsing:**
- Scroll through all open tabs by window
- Use sticky headers to track your location
- Quickly identify and switch between work/personal/research windows

**Clean up tabs:**
- Filter by URL to find all tabs from a specific site
- Use advanced filters to find tabs by multiple criteria
- Easy bulk navigation without opening new tabs

## Installation

1. Download or clone this repository
2. Open Chrome → Extensions → Developer mode ON
3. Click "Load unpacked" and select the extension folder
4. The extension icon will appear in your toolbar

## Technical Details

- **Manifest Version**: 3
- **Permissions**: History access, tab management, active tab detection, window management, sessions API
- **Storage**: Uses localStorage for preferences, filter persistence, closed window data, and active tab memory
- **Theme Support**: CSS variables with system theme detection
- **Performance**: Efficient filtering with up to 100,000 history items + real-time tab management
- **Search Types**: Dual-mode searching in URLs and page titles for both history and tabs
- **Tab Integration**: Real-time open tab detection, smart navigation, and complete tab organization
- **Window Tracking**: Complete window management with open/closed window tracking and session preservation
- **Chrome Integration**: Leverages chrome.sessions API for native recently closed sessions (when available)
- **Triple Interface**: History (past), Windows (management), Tabs (current) with intelligent separation
- **Smart UI**: Contextual controls that appear/hide based on user actions and active filters
- **Memory Features**: Remembers last active tab and user preferences across sessions
- **Dual System**: Both custom persistent tracking (50 windows) and Chrome's native sessions
- **Data Limits**: 50 custom closed windows + Chrome's native sessions, 100 results per search, unlimited tabs
- **Privacy**: All data processing and storage happens locally with no external network requests

## Privacy

- **Local Only**: All data processing happens locally in your browser
- **No Network**: Extension doesn't send any data to external servers
- **Chrome APIs**: Uses only standard Chrome extension APIs for history access

---

**Version**: 1.1
**Compatibility**: Chrome (Manifest V3)
**New in 1.1**: Complete tab management, sticky headers, tab memory, and enhanced filtering