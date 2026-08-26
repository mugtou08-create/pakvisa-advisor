import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CountryData, UserProfileData, ScoreBreakdown } from './types';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'policy' | 'expiry' | 'new-country';
  read: boolean;
  date: string;
}

export interface TripDestination {
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  startDate: string;
  endDate: string;
  estimatedDays: number;
  estimatedCost: number;
  visaType: string;
}

interface AppState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCountry: CountryData | null;
  setSelectedCountry: (country: CountryData | null) => void;
  userProfile: UserProfileData | null;
  setUserProfile: (profile: UserProfileData) => void;
  scoreResults: ScoreBreakdown[];
  addScoreResult: (result: ScoreBreakdown) => void;
  clearScoreResults: () => void;
  questionnaireStep: number;
  setQuestionnaireStep: (step: number) => void;
  comparisonCountries: string[];
  setComparisonCountries: (codes: string[]) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  dashboardExpanded: boolean;
  setDashboardExpanded: (expanded: boolean) => void;
  lastDataFetch: string;
  setLastDataFetch: (date: string) => void;
  favorites: string[];
  toggleFavorite: (code: string) => void;
  isFavorite: (code: string) => boolean;
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  targetTravelDate: string;
  setTargetTravelDate: (date: string) => void;
  travelChecklist: Record<string, boolean>;
  setTravelChecklistItem: (key: string, checked: boolean) => void;
  clearTravelChecklist: () => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  addChatMessage: (role: 'user' | 'assistant', content: string) => void;
  updateLastChatMessage: (content: string) => void;
  savedBudgets: Record<string, { duration: number; tier: string; foodPerDay: number; transportPerDay: number; activities: number }>;
  saveBudget: (countryCode: string, budget: { duration: number; tier: string; foodPerDay: number; transportPerDay: number; activities: number }) => void;
  conversionHistory: Array<{ from: string; to: string; amount: number; result: number; timestamp: string }>;
  addConversion: (entry: { from: string; to: string; amount: number; result: number }) => void;
  clearConversionHistory: () => void;
  userFeedback: { rating: number; comment: string; submittedAt: string } | null;
  submitFeedback: (rating: number, comment: string) => void;
  tripPlan: TripDestination[];
  addTripDestination: (dest: TripDestination) => void;
  removeTripDestination: (index: number) => void;
  reorderTripDestination: (fromIndex: number, toIndex: number) => void;
  clearTripPlan: () => void;
  // Search History Enhancement
  recentSearches: Array<{ query: string; timestamp: number }>;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // Dashboard Widgets Order
  dashboardWidgets: string[];
  reorderWidget: (fromIndex: number, toIndex: number) => void;
  // Pro Membership
  isProUser: boolean;
  setIsProUser: (pro: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      activeTab: 'explore',
      setActiveTab: (tab) => set({ activeTab: tab }),
      selectedCountry: null,
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      userProfile: null,
      setUserProfile: (profile) => set({ userProfile: profile }),
      scoreResults: [],
      addScoreResult: (result) => set((state) => ({ scoreResults: [...state.scoreResults, result] })),
      clearScoreResults: () => set({ scoreResults: [] }),
      questionnaireStep: 0,
      setQuestionnaireStep: (step) => set({ questionnaireStep: step }),
      comparisonCountries: [],
      setComparisonCountries: (codes) => set({ comparisonCountries: codes }),
      viewMode: 'grid',
      setViewMode: (mode) => set({ viewMode: mode }),
      dashboardExpanded: true,
      setDashboardExpanded: (expanded) => set({ dashboardExpanded: expanded }),
      lastDataFetch: '',
      setLastDataFetch: (date) => set({ lastDataFetch: date }),
      favorites: [],
      toggleFavorite: (code) => set((state) => ({
        favorites: state.favorites.includes(code)
          ? state.favorites.filter((f) => f !== code)
          : [...state.favorites, code],
      })),
      isFavorite: (code) => {
        const state = useAppStore.getState();
        return state.favorites.includes(code);
      },
      notifications: [
        { id: 'n1', title: 'Visa Policy Update', message: 'UAE has updated visa-on-arrival requirements for Pakistani passport holders. New insurance requirement added.', type: 'policy', read: false, date: new Date(Date.now() - 2 * 86400000).toISOString() },
        { id: 'n2', title: 'Assessment Expiring Soon', message: 'Your last visa assessment is over 30 days old. Scores may not reflect current policies.', type: 'expiry', read: false, date: new Date(Date.now() - 5 * 86400000).toISOString() },
        { id: 'n3', title: 'New Countries Added', message: '3 new destinations added: Azerbaijan, Bahrain, and Jordan with updated visa data.', type: 'new-country', read: false, date: new Date(Date.now() - 7 * 86400000).toISOString() },
        { id: 'n4', title: 'Saudi Visa Fee Change', message: 'Saudi Arabia has revised visa fees for Pakistani citizens. Check updated costs.', type: 'policy', read: true, date: new Date(Date.now() - 14 * 86400000).toISOString() },
      ],
      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      })),
      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
      })),
      targetTravelDate: '',
      setTargetTravelDate: (date) => set({ targetTravelDate: date }),
      travelChecklist: {},
      setTravelChecklistItem: (key, checked) => set((state) => ({
        travelChecklist: { ...state.travelChecklist, [key]: checked },
      })),
      clearTravelChecklist: () => set({ travelChecklist: {} }),
      chatOpen: false,
      setChatOpen: (open) => set({ chatOpen: open }),
      chatHistory: [],
      addChatMessage: (role, content) => set((state) => ({
        chatHistory: [...state.chatHistory, { role, content }],
      })),
      updateLastChatMessage: (content) => set((state) => {
        const updated = [...state.chatHistory];
        if (updated.length > 0) {
          updated[updated.length - 1] = { ...updated[updated.length - 1], content };
        }
        return { chatHistory: updated };
      }),
      savedBudgets: {},
      saveBudget: (countryCode, budget) => set((state) => ({
        savedBudgets: { ...state.savedBudgets, [countryCode]: budget },
      })),
      conversionHistory: [],
      addConversion: (entry) => set((state) => ({
        conversionHistory: [{ ...entry, timestamp: new Date().toISOString() }, ...state.conversionHistory].slice(0, 5),
      })),
      clearConversionHistory: () => set({ conversionHistory: [] }),
      userFeedback: null,
      submitFeedback: (rating, comment) => set({
        userFeedback: { rating, comment, submittedAt: new Date().toISOString() },
      }),
      tripPlan: [],
      addTripDestination: (dest) => set((state) => ({
        tripPlan: state.tripPlan.length >= 5 ? state.tripPlan : [...state.tripPlan, dest],
      })),
      removeTripDestination: (index) => set((state) => ({
        tripPlan: state.tripPlan.filter((_, i) => i !== index),
      })),
      reorderTripDestination: (fromIndex, toIndex) => set((state) => {
        const updated = [...state.tripPlan];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return { tripPlan: updated };
      }),
      clearTripPlan: () => set({ tripPlan: [] }),

      // Search History Enhancement
      recentSearches: [],
      addRecentSearch: (query) => set((state) => ({
        recentSearches: [
          { query, timestamp: Date.now() },
          ...state.recentSearches.filter((s) => s.query.toLowerCase() !== query.toLowerCase()),
        ].slice(0, 10),
      })),
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Dashboard Widgets Order
      dashboardWidgets: ['passport-power', 'continent-stats', 'readiness', 'recommendations', 'world-map', 'policy-tracker'],
      reorderWidget: (fromIndex, toIndex) => set((state) => {
        const updated = [...state.dashboardWidgets];
        const [moved] = updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, moved);
        return { dashboardWidgets: updated };
      }),
      // Pro Membership
      isProUser: false,
      setIsProUser: (pro) => set({ isProUser: pro }),
    }),
    {
      name: 'pakvisa-store',
      partialize: (state) => ({
        userProfile: state.userProfile,
        scoreResults: state.scoreResults,
        questionnaireStep: state.questionnaireStep,
        viewMode: state.viewMode,
        dashboardExpanded: state.dashboardExpanded,
        favorites: state.favorites,
        notifications: state.notifications,
        targetTravelDate: state.targetTravelDate,
        travelChecklist: state.travelChecklist,
        chatHistory: state.chatHistory,
        savedBudgets: state.savedBudgets,
        conversionHistory: state.conversionHistory,
        userFeedback: state.userFeedback,
        tripPlan: state.tripPlan,
        recentSearches: state.recentSearches,
        dashboardWidgets: state.dashboardWidgets,
        // isProUser intentionally excluded from persistence — runtime-only state
      }),
    }
  )
);