import { Injectable, signal } from '@angular/core';

export const AVAILABLE_THEMES = [
  'dark', 'light', 'dracula', 'synthwave', 'cyberpunk', 
  'retro', 'valentine', 'aqua', 'night', 'coffee', 
  'dim', 'nord', 'sunset', 'cupcake', 'bumblebee', 
  'emerald', 'corporate', 'halloween', 'garden', 
  'forest', 'lofi', 'pastel', 'fantasy', 'wireframe', 
  'black', 'luxury', 'cmyk', 'autumn', 'business', 
  'acid', 'lemonade', 'winter'
];

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public currentTheme = signal<string>('dark');

  constructor() {
    const savedTheme = localStorage.getItem('app-theme') || 'dark';
    this.setTheme(savedTheme);
  }

  setTheme(theme: string) {
    if (AVAILABLE_THEMES.includes(theme)) {
      this.currentTheme.set(theme);
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('app-theme', theme);
    }
  }
}
