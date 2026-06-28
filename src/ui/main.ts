import { PopulateMessage, SelectionMessage, TrackEntry } from '../types'
import { searchTracks, fetchArtworkBytes } from './itunes'
import { extractDominantColor } from './dominant-color'
import { RecentsStore, createStore } from './recents'
import { makeItem, addSection } from './render'
import { loadFeatured } from './featured'

const recents = new RecentsStore(createStore())

const searchInput = document.getElementById('search-input') as HTMLInputElement
const clearBtn = document.getElementById('clear-btn') as HTMLButtonElement
const resultsArea = document.getElementById('results-area') as HTMLElement
const statusLabel = document.getElementById('status-label') as HTMLElement
let debounceTimer: ReturnType<typeof setTimeout> | undefined

window.onmessage = (event: MessageEvent) => {
  const msg = event.data.pluginMessage as SelectionMessage | undefined
  if (!msg || msg.type !== 'selection') return
  statusLabel.textContent = msg.status.message
}

function selectEntry(entry: TrackEntry): void {
  void (async () => {
    const artworkBytes = await fetchArtworkBytes(entry.artworkUrl)
    recents.add(entry)
    const message: PopulateMessage = {
      type: 'populate',
      trackName: entry.trackName,
      artistName: entry.artistName,
      artworkBytes,
      dominantColor: entry.dominantColor,
    }
    parent.postMessage({ pluginMessage: message }, '*')
  })()
}

function renderEntries(container: HTMLElement, entries: TrackEntry[]): void {
  entries.forEach((entry) => container.appendChild(makeItem(entry, () => selectEntry(entry))))
}

async function renderDefault(): Promise<void> {
  resultsArea.innerHTML = ''
  const recent = recents.get()
  if (recent.length > 0) {
    const list = addSection(resultsArea, 'Recently used', () => {
      recents.clear()
      void renderDefault()
    })
    renderEntries(list, recent)
    return
  }
  const list = addSection(resultsArea, 'Featured')
  list.innerHTML =
    '<div class="loading" style="text-align:left;padding:8px 12px;">Loading&hellip;</div>'
  const featured = await loadFeatured()
  list.innerHTML = ''
  if (!featured.length) {
    list.innerHTML = '<div class="empty-state">Could not load featured tracks</div>'
    return
  }
  renderEntries(list, featured)
}

async function doSearch(): Promise<void> {
  const query = searchInput.value.trim()
  if (!query) return
  resultsArea.innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>'
  try {
    const tracks = await searchTracks(query)
    if (!tracks.length) {
      resultsArea.innerHTML = '<div class="empty-state">No results found</div>'
      return
    }
    const colors = await Promise.all(
      tracks.map((t) => (t.artworkUrl ? extractDominantColor(t.artworkUrl) : Promise.resolve(null)))
    )
    resultsArea.innerHTML = ''
    const list = document.createElement('div')
    list.className = 'results-list'
    tracks.forEach((t, i) => {
      const entry: TrackEntry = { ...t, dominantColor: colors[i] }
      list.appendChild(makeItem(entry, () => selectEntry(entry)))
    })
    resultsArea.appendChild(list)
  } catch {
    resultsArea.innerHTML = '<div class="empty-state">Search failed — check your connection</div>'
  }
}

function scheduleSearch(): void {
  clearBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none'
  const query = searchInput.value.trim()
  if (!query) {
    clearTimeout(debounceTimer)
    void renderDefault()
    return
  }
  if (query.length < 2) {
    clearTimeout(debounceTimer)
    return
  }
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => void doSearch(), 350)
}

clearBtn.addEventListener('click', () => {
  searchInput.value = ''
  clearBtn.style.display = 'none'
  clearTimeout(debounceTimer)
  void renderDefault()
  searchInput.focus()
})

searchInput.addEventListener('input', scheduleSearch)
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    clearTimeout(debounceTimer)
    void doSearch()
  }
})

void renderDefault()
