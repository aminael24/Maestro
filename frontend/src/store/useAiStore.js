import { create } from 'zustand';

export const useAiStore = create((set) => ({
  files: {
    sql: '-- Aucun code généré pour le moment',
    model: '// Vide',
    controller: '// Vide',
    routes: '// Vide',
    frontend: '// Vide',
  },
  activeFile: 'sql',
  explanation: '',
  selectedCode: null,
  selectedFile: null,

  setProjectCode: (data) => set({
    files: {
      sql: data.sql || '',
      model: data.model || '',
      controller: data.controller || '',
      routes: data.routes || '',
      frontend: data.frontend || '',
    },
    explanation: data.explanation || '',
    activeFile: 'sql',
  }),

  setActiveFile: (fileKey) => set({ activeFile: fileKey }),

  updateFile: (fileKey, newContent) => set((state) => ({
    files: { ...state.files, [fileKey]: newContent }
  })),

  setSelectedCode: (code, fileKey) => set({
    selectedCode: code,
    selectedFile: fileKey,
  }),

  clearSelectedCode: () => set({
    selectedCode: null,
    selectedFile: null,
  }),

  resetProject: () => set({
    files: {
      sql: '',
      model: '',
      controller: '',
      routes: '',
      frontend: '',
    },
    activeFile: 'sql',
    explanation: '',
    selectedCode: null,
    selectedFile: null,
  }),
}));