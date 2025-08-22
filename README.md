# Search History

A powerful Chrome extension for searching and filtering your browser history with advanced criteria and bulk actions.

## Features

### 🔍 Advanced Filtering
- **Stacked Filters**: Add multiple filter criteria that work together
- **Include/Exclude Logic**: Each filter can include or exclude URLs containing specific text
- **Live Search**: Results update as you type
- **URL-Only Search**: Filters search only URLs, not page titles or metadata

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
- **Search Highlighting**: Matching text is subtly underlined
- **Page Titles**: Toggle to show/hide page titles above URLs
- **Dark/Light Theme**: Automatically follows your system theme
- **Clean Interface**: Compact design with smooth scrolling
- **No Horizontal Overflow**: Long URLs wrap properly

### ⚡ Bulk Actions
- **Open All in New Window**: Open all filtered results as tabs in a new window
- **Smart Limits**: Automatically limits to 100 URLs to prevent browser overload

### 💾 Persistent State
The extension remembers your preferences:
- Last selected time range
- All filter text and Include/Exclude settings
- Show/hide titles preference
- Number of active filters

### 🧹 Easy Management
- **Clear Filters**: One-click button to reset all filters (appears when needed)
- **Remove Individual Filters**: Remove specific filters with dedicated buttons
- **Smart UI**: Clear button only shows when you have active filters

## How to Use

### Basic Search
1. Click the extension icon
2. Type in the search box (e.g., "youtube.com")
3. See filtered results organized by date

### Advanced Filtering
1. Add additional filters with "Add Filter" button
2. Choose **Include** to show URLs containing the text
3. Choose **Exclude** to hide URLs containing the text
4. Stack multiple criteria for precise results

### Example Workflows

**Find recent social media visits:**
- Filter 1: "twitter.com" (Include)
- Time range: "Past week"

**Find YouTube videos but not ads:**
- Filter 1: "youtube.com" (Include)  
- Filter 2: "ads" (Exclude)

**Research from last month:**
- Filter 1: "github.com" (Include)
- Time range: "Past month"

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
- **Permissions**: History access, tab management
- **Storage**: Uses localStorage for preferences
- **Theme Support**: CSS variables with system theme detection
- **Performance**: Efficient filtering with up to 100,000 history items

## Privacy

- **Local Only**: All data processing happens locally in your browser
- **No Network**: Extension doesn't send any data to external servers
- **Chrome APIs**: Uses only standard Chrome extension APIs for history access

---

**Version**: 1.0  
**Compatibility**: Chrome (Manifest V3)