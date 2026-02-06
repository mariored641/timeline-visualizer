import { create } from 'zustand';
import timelineData from '../data/timeline_data.json';
import { apiService } from '../services/apiService';

const useStore = create((set, get) => ({
  // נתוני הציר
  metadata: timelineData.metadata,
  categories: timelineData.categories,
  locations: timelineData.locations,
  people: timelineData.people,
  events: timelineData.events,

  // מצב סנכרון
  isLoading: true,
  isSaving: false,
  lastSyncError: null,
  lastSynced: null,

  // מצב UI
  sidebarOpen: timelineData.ui_state.sidebar.isOpen,
  zoomState: {
    startYear: timelineData.ui_state.zoom.start_year,
    endYear: timelineData.ui_state.zoom.end_year,
    minYear: -3000,
    maxYear: 2100,
    zoomLevel: 1.0,
    verticalScale: 1.0
  },

  // השוואה
  comparisonItems: timelineData.ui_state.comparison.items,

  // קווים מקבילים
  parallelLines: {
    isVisible: false,
    leftLine: null,
    rightLine: null,
    highlightedItem: null
  },

  // פריט נבחר
  selectedItem: null,

  // מצב סימון
  markingMode: false,
  highlightedItems: [], // Array of item IDs

  // גרירה אנכית - אופסטים ידניים
  dragOffsets: {}, // { itemId: deltaY }

  // פאנל פרטים
  detailPanelOpen: false,
  detailPanelItem: null,
  detailPanelEditing: false,

  // מודל הוספה
  addModalOpen: false,
  addModalType: null, // 'person' או 'event'

  // מודל ייבוא
  importModalOpen: false,
  importModalType: null, // 'wikipedia' או 'json'

  // Tooltip
  tooltip: {
    visible: false,
    x: 0,
    y: 0,
    content: null
  },

  // Context menu
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    item: null
  },

  // API sync actions

  initializeFromApi: async () => {
    try {
      set({ isLoading: true, lastSyncError: null });
      const data = await apiService.fetchData();

      if (data) {
        set({
          metadata: data.metadata || timelineData.metadata,
          categories: timelineData.categories,   // תמיד מהקובץ המקומי
          locations: timelineData.locations,      // תמיד מהקובץ המקומי
          people: data.people || timelineData.people,
          events: data.events || timelineData.events,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load from API:', error);
      set({ isLoading: false, lastSyncError: 'שגיאה בטעינת נתונים מהשרת' });
    }
  },

  syncToApi: async () => {
    const state = get();
    const dataToSync = {
      metadata: state.metadata,
      people: state.people,
      events: state.events,
    };

    try {
      set({ isSaving: true });
      await apiService.saveData(dataToSync);
      set({ isSaving: false, lastSynced: new Date().toISOString(), lastSyncError: null });
    } catch (error) {
      console.error('Failed to sync:', error);
      set({ isSaving: false, lastSyncError: 'שגיאה בשמירה. השינויים נשמרו מקומית.' });
    }
  },

  // Actions

  // Toggle sidebar
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Zoom actions
  // Combined zoom (both axes)
  zoomIn: () => set((state) => {
    const { startYear, endYear } = state.zoomState;
    const range = endYear - startYear;
    const newRange = range * 0.7;
    const center = (startYear + endYear) / 2;

    return {
      zoomState: {
        ...state.zoomState,
        startYear: Math.floor(center - newRange / 2),
        endYear: Math.ceil(center + newRange / 2),
        zoomLevel: state.zoomState.zoomLevel * 1.43,
        verticalScale: Math.min(state.zoomState.verticalScale * 1.3, 3.0)
      }
    };
  }),

  zoomOut: () => set((state) => {
    const { startYear, endYear, minYear, maxYear } = state.zoomState;
    const range = endYear - startYear;
    const newRange = range * 1.43;
    const center = (startYear + endYear) / 2;

    return {
      zoomState: {
        ...state.zoomState,
        startYear: Math.max(minYear, Math.floor(center - newRange / 2)),
        endYear: Math.min(maxYear, Math.ceil(center + newRange / 2)),
        zoomLevel: state.zoomState.zoomLevel * 0.7,
        verticalScale: Math.max(state.zoomState.verticalScale * 0.77, 0.15)
      }
    };
  }),

  // Horizontal-only zoom
  zoomInHorizontal: () => set((state) => {
    const { startYear, endYear } = state.zoomState;
    const range = endYear - startYear;
    const newRange = range * 0.7;
    const center = (startYear + endYear) / 2;

    return {
      zoomState: {
        ...state.zoomState,
        startYear: Math.floor(center - newRange / 2),
        endYear: Math.ceil(center + newRange / 2),
        zoomLevel: state.zoomState.zoomLevel * 1.43
      }
    };
  }),

  zoomOutHorizontal: () => set((state) => {
    const { startYear, endYear, minYear, maxYear } = state.zoomState;
    const range = endYear - startYear;
    const newRange = range * 1.43;
    const center = (startYear + endYear) / 2;

    return {
      zoomState: {
        ...state.zoomState,
        startYear: Math.max(minYear, Math.floor(center - newRange / 2)),
        endYear: Math.min(maxYear, Math.ceil(center + newRange / 2)),
        zoomLevel: state.zoomState.zoomLevel * 0.7
      }
    };
  }),

  // Vertical-only zoom
  zoomInVertical: () => set((state) => ({
    zoomState: {
      ...state.zoomState,
      verticalScale: Math.min(state.zoomState.verticalScale * 1.3, 3.0)
    }
  })),

  zoomOutVertical: () => set((state) => ({
    zoomState: {
      ...state.zoomState,
      verticalScale: Math.max(state.zoomState.verticalScale * 0.77, 0.15)
    }
  })),

  panLeft: () => set((state) => {
    const { startYear, endYear, minYear } = state.zoomState;
    const range = endYear - startYear;
    const shift = Math.floor(range * 0.2);

    if (startYear - shift >= minYear) {
      return {
        zoomState: {
          ...state.zoomState,
          startYear: startYear - shift,
          endYear: endYear - shift
        }
      };
    }
    return state;
  }),

  panRight: () => set((state) => {
    const { startYear, endYear, maxYear } = state.zoomState;
    const range = endYear - startYear;
    const shift = Math.floor(range * 0.2);

    if (endYear + shift <= maxYear) {
      return {
        zoomState: {
          ...state.zoomState,
          startYear: startYear + shift,
          endYear: endYear + shift
        }
      };
    }
    return state;
  }),

  setZoomRange: (startYear, endYear) => set((state) => ({
    zoomState: {
      ...state.zoomState,
      startYear,
      endYear
    }
  })),

  // Set vertical scale directly (used by pinch-to-zoom)
  setVerticalScale: (scale) => set((state) => ({
    zoomState: {
      ...state.zoomState,
      verticalScale: Math.max(0.15, Math.min(3.0, scale))
    }
  })),

  // Category visibility
  toggleCategoryVisibility: (categoryId) => set((state) => ({
    categories: state.categories.map(cat =>
      cat.id === categoryId ? { ...cat, visible: !cat.visible } : cat
    )
  })),

  // Add person
  addPerson: (person) => {
    set((state) => ({
      people: [...state.people, {
        ...person,
        position: {
          y: null,
          isManuallyPlaced: false,
          isPinned: false
        },
        visibility: {
          isHidden: false,
          isInComparison: false
        }
      }],
      metadata: {
        ...state.metadata,
        total_people: state.metadata.total_people + 1
      }
    }));
    get().syncToApi();
  },

  // Add event
  addEvent: (event) => {
    set((state) => ({
      events: [...state.events, {
        ...event,
        position: {
          y: null,
          isManuallyPlaced: false
        },
        visibility: {
          isHidden: false
        }
      }],
      metadata: {
        ...state.metadata,
        total_events: state.metadata.total_events + 1
      }
    }));
    get().syncToApi();
  },

  // Update person
  updatePerson: (id, updates) => {
    set((state) => ({
      people: state.people.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    get().syncToApi();
  },

  // Update event
  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map(e => e.id === id ? { ...e, ...updates } : e)
    }));
    get().syncToApi();
  },

  // Delete person
  deletePerson: (id) => {
    set((state) => ({
      people: state.people.filter(p => p.id !== id),
      metadata: {
        ...state.metadata,
        total_people: state.metadata.total_people - 1
      }
    }));
    get().syncToApi();
  },

  // Delete event
  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter(e => e.id !== id),
      metadata: {
        ...state.metadata,
        total_events: state.metadata.total_events - 1
      }
    }));
    get().syncToApi();
  },

  // Hide/show item
  toggleItemVisibility: (id, type) => set((state) => {
    if (type === 'person') {
      return {
        people: state.people.map(p =>
          p.id === id
            ? { ...p, visibility: { ...p.visibility, isHidden: !p.visibility.isHidden } }
            : p
        )
      };
    } else {
      return {
        events: state.events.map(e =>
          e.id === id
            ? { ...e, visibility: { ...e.visibility, isHidden: !e.visibility.isHidden } }
            : e
        )
      };
    }
  }),

  // Pin item
  toggleItemPin: (id, type) => set((state) => {
    if (type === 'person') {
      return {
        people: state.people.map(p =>
          p.id === id
            ? { ...p, position: { ...p.position, isPinned: !p.position.isPinned } }
            : p
        )
      };
    }
    return state;
  }),

  // Comparison
  addToComparison: (id, type) => set((state) => {
    const item = type === 'person'
      ? state.people.find(p => p.id === id)
      : state.events.find(e => e.id === id);

    if (!item) return state;

    if (type === 'person') {
      return {
        people: state.people.map(p =>
          p.id === id
            ? { ...p, visibility: { ...p.visibility, isInComparison: true } }
            : p
        ),
        comparisonItems: [...state.comparisonItems, { id, type, item }]
      };
    }

    return {
      comparisonItems: [...state.comparisonItems, { id, type, item }]
    };
  }),

  removeFromComparison: (id) => set((state) => {
    const compItem = state.comparisonItems.find(c => c.id === id);

    return {
      people: state.people.map(p =>
        p.id === id
          ? { ...p, visibility: { ...p.visibility, isInComparison: false } }
          : p
      ),
      comparisonItems: state.comparisonItems.filter(c => c.id !== id)
    };
  }),

  clearComparison: () => set((state) => ({
    people: state.people.map(p => ({
      ...p,
      visibility: { ...p.visibility, isInComparison: false }
    })),
    comparisonItems: []
  })),

  // Parallel lines
  showParallelLines: (item) => set({
    parallelLines: {
      isVisible: true,
      leftLine: {
        year: item.birth || item.start_year,
        label: `${item.birth || item.start_year}`
      },
      rightLine: {
        year: item.death || item.end_year || new Date().getFullYear(),
        label: `${item.death || item.end_year || 'היום'}`
      },
      highlightedItem: item.id
    }
  }),

  hideParallelLines: () => set({
    parallelLines: {
      isVisible: false,
      leftLine: null,
      rightLine: null,
      highlightedItem: null
    }
  }),

  // Modals
  openAddModal: (type) => set({ addModalOpen: true, addModalType: type }),
  closeAddModal: () => set({ addModalOpen: false, addModalType: null }),

  openImportModal: (type) => set({ importModalOpen: true, importModalType: type }),
  closeImportModal: () => set({ importModalOpen: false, importModalType: null }),

  // Marking mode
  toggleMarkingMode: () => set((state) => ({ markingMode: !state.markingMode })),
  toggleHighlight: (itemId) => set((state) => ({
    highlightedItems: state.highlightedItems.includes(itemId)
      ? state.highlightedItems.filter(id => id !== itemId)
      : [...state.highlightedItems, itemId]
  })),
  clearHighlights: () => set({ highlightedItems: [] }),

  // Drag offsets (vertical free drag)
  setDragOffset: (itemId, deltaY) => set((state) => ({
    dragOffsets: { ...state.dragOffsets, [itemId]: deltaY }
  })),
  setDragOffsets: (offsets) => set((state) => ({
    dragOffsets: { ...state.dragOffsets, ...offsets }
  })),
  clearDragOffsets: () => set({ dragOffsets: {} }),

  // Compact layout: remove empty rows while preserving the current visual order
  // This ensures that if user dragged A below B, A stays below B after compaction
  compactLayout: () => {
    const state = get();
    const MIN_SPACING = 35;
    const visibleCategories = state.categories.filter(c => c.visible);
    const newOffsets = {};

    visibleCategories.forEach(category => {
      const categoryPeople = state.people.filter(
        p => p.categories.includes(category.id) && !p.visibility.isHidden && p.categories[0] === category.id
      );
      // All events belong to "events" category
      const categoryEvents = category.id === 'events'
        ? state.events.filter(e => !e.visibility.isHidden)
        : [];
      const allItems = [...categoryPeople, ...categoryEvents];

      // Get effective Y for each item (current visual position)
      const itemsWithY = allItems.map(item => ({
        id: item.id,
        baseY: item.position.y || 0,
        dragOffset: state.dragOffsets[item.id] || 0,
        effectiveY: (item.position.y || 0) + (state.dragOffsets[item.id] || 0),
        // Store time range for overlap checking
        timeStart: item.birth || item.start_year,
        timeEnd: item.death || item.end_year || new Date().getFullYear(),
      }));

      // Sort by current effective Y (this preserves the user's drag order)
      itemsWithY.sort((a, b) => a.effectiveY - b.effectiveY);

      // Now assign compact rows, processing items in the order they appear visually.
      // Each item goes to the FIRST row where it fits (no time overlap),
      // but we never place it ABOVE items that were visually above it.
      const rows = []; // rows[r] = array of items in that row
      const itemRowMap = new Map(); // itemId -> assigned row index

      itemsWithY.forEach(item => {
        let placedInRow = -1;

        for (let r = 0; r < rows.length; r++) {
          const canFit = rows[r].every(other =>
            item.timeEnd < other.timeStart || item.timeStart > other.timeEnd
          );
          if (canFit) {
            placedInRow = r;
            break;
          }
        }

        if (placedInRow === -1) {
          placedInRow = rows.length;
          rows.push([]);
        }

        rows[placedInRow].push(item);
        itemRowMap.set(item.id, placedInRow);

        const targetY = placedInRow * MIN_SPACING;
        const neededOffset = targetY - item.baseY;
        newOffsets[item.id] = Math.abs(neededOffset) > 0.5 ? neededOffset : 0;
      });
    });

    set({ dragOffsets: newOffsets });
  },

  // Category reorder
  reorderCategories: (fromIndex, toIndex) => set((state) => {
    const newCategories = [...state.categories]
    const [moved] = newCategories.splice(fromIndex, 1)
    newCategories.splice(toIndex, 0, moved)
    return { categories: newCategories.map((c, i) => ({ ...c, order: i + 1 })) }
  }),

  // Detail panel
  openDetailPanel: (item) => set({ detailPanelOpen: true, detailPanelItem: item, detailPanelEditing: false }),
  closeDetailPanel: () => set({ detailPanelOpen: false, detailPanelItem: null, detailPanelEditing: false }),
  toggleDetailEditing: () => set((state) => ({ detailPanelEditing: !state.detailPanelEditing })),

  // Tooltip
  showTooltip: (x, y, content) => set({ tooltip: { visible: true, x, y, content } }),
  hideTooltip: () => set({ tooltip: { visible: false, x: 0, y: 0, content: null } }),

  // Context menu
  showContextMenu: (x, y, item) => set({ contextMenu: { visible: true, x, y, item } }),
  hideContextMenu: () => set({ contextMenu: { visible: false, x: 0, y: 0, item: null } }),

  // Import bulk data
  importBulkData: (data, strategy = 'skip') => {
    set((state) => {
    let newPeople = [...state.people];
    let newEvents = [...state.events];
    let imported = 0;
    let skipped = 0;

    // Helper to normalize person data
    const normalizePerson = (person) => ({
      ...person,
      position: person.position || {
        y: null,
        isManuallyPlaced: false,
        isPinned: false
      },
      visibility: person.visibility || {
        isHidden: false,
        isInComparison: false
      }
    });

    // Helper to normalize event data
    const normalizeEvent = (event) => ({
      ...event,
      position: event.position || {
        y: null,
        isManuallyPlaced: false
      },
      visibility: event.visibility || {
        isHidden: false
      }
    });

    // Import people
    if (data.people && Array.isArray(data.people)) {
      data.people.forEach(person => {
        const normalizedPerson = normalizePerson(person);
        const exists = newPeople.some(p => p.id === person.id);

        if (exists) {
          if (strategy === 'overwrite') {
            newPeople = newPeople.map(p => p.id === person.id ? normalizedPerson : p);
            imported++;
          } else {
            skipped++;
          }
        } else {
          newPeople.push(normalizedPerson);
          imported++;
        }
      });
    }

    // Import events
    if (data.events && Array.isArray(data.events)) {
      data.events.forEach(event => {
        const normalizedEvent = normalizeEvent(event);
        const exists = newEvents.some(e => e.id === event.id);

        if (exists) {
          if (strategy === 'overwrite') {
            newEvents = newEvents.map(e => e.id === event.id ? normalizedEvent : e);
            imported++;
          } else {
            skipped++;
          }
        } else {
          newEvents.push(normalizedEvent);
          imported++;
        }
      });
    }

    return {
      people: newPeople,
      events: newEvents,
      metadata: {
        ...state.metadata,
        total_people: newPeople.length,
        total_events: newEvents.length
      }
    };
    });
    get().syncToApi();
  },

  // Export data
  exportData: () => {
    const state = get();

    return {
      metadata: {
        ...state.metadata,
        exported_at: new Date().toISOString()
      },
      categories: state.categories,
      locations: state.locations,
      people: state.people.map(p => ({
        ...p,
        position: { y: null, isManuallyPlaced: false, isPinned: false },
        visibility: { isHidden: false, isInComparison: false }
      })),
      events: state.events.map(e => ({
        ...e,
        position: { y: null, isManuallyPlaced: false },
        visibility: { isHidden: false }
      }))
    };
  }
}));

export default useStore;
