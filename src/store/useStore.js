import { create } from 'zustand';
import timelineData from '../data/timeline_data.json';

const useStore = create((set, get) => ({
  // נתוני הציר
  metadata: timelineData.metadata,
  categories: timelineData.categories,
  locations: timelineData.locations,
  people: timelineData.people,
  events: timelineData.events,

  // מצב UI
  sidebarOpen: timelineData.ui_state.sidebar.isOpen,
  zoomState: {
    startYear: timelineData.ui_state.zoom.start_year,
    endYear: timelineData.ui_state.zoom.end_year,
    minYear: -3000,
    maxYear: 2100,
    zoomLevel: 1.0
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

  // פאנל פרטים
  detailPanelOpen: false,
  detailPanelItem: null,

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

  // Actions

  // Toggle sidebar
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Zoom actions
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
        zoomLevel: state.zoomState.zoomLevel * 1.43
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
        zoomLevel: state.zoomState.zoomLevel * 0.7
      }
    };
  }),

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

  // Category visibility
  toggleCategoryVisibility: (categoryId) => set((state) => ({
    categories: state.categories.map(cat =>
      cat.id === categoryId ? { ...cat, visible: !cat.visible } : cat
    )
  })),

  // Add person
  addPerson: (person) => set((state) => ({
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
  })),

  // Add event
  addEvent: (event) => set((state) => ({
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
  })),

  // Update person
  updatePerson: (id, updates) => set((state) => ({
    people: state.people.map(p => p.id === id ? { ...p, ...updates } : p)
  })),

  // Update event
  updateEvent: (id, updates) => set((state) => ({
    events: state.events.map(e => e.id === id ? { ...e, ...updates } : e)
  })),

  // Delete person
  deletePerson: (id) => set((state) => ({
    people: state.people.filter(p => p.id !== id),
    metadata: {
      ...state.metadata,
      total_people: state.metadata.total_people - 1
    }
  })),

  // Delete event
  deleteEvent: (id) => set((state) => ({
    events: state.events.filter(e => e.id !== id),
    metadata: {
      ...state.metadata,
      total_events: state.metadata.total_events - 1
    }
  })),

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

  // Detail panel
  openDetailPanel: (item) => set({ detailPanelOpen: true, detailPanelItem: item }),
  closeDetailPanel: () => set({ detailPanelOpen: false, detailPanelItem: null }),

  // Tooltip
  showTooltip: (x, y, content) => set({ tooltip: { visible: true, x, y, content } }),
  hideTooltip: () => set({ tooltip: { visible: false, x: 0, y: 0, content: null } }),

  // Context menu
  showContextMenu: (x, y, item) => set({ contextMenu: { visible: true, x, y, item } }),
  hideContextMenu: () => set({ contextMenu: { visible: false, x: 0, y: 0, item: null } }),

  // Import bulk data
  importBulkData: (data, strategy = 'skip') => set((state) => {
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
  }),

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
