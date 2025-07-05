import React, { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon, Volume2, VolumeX } from "lucide-react";

// Create contexts for theme and sound
export const ThemeContext = createContext();
export const SoundContext = createContext();

// Sound manager class
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = JSON.parse(localStorage.getItem("soundEnabled") || "true");
    this.volume = parseFloat(localStorage.getItem("soundVolume") || "0.3");
    this.audioContext = null;
    this.gainNode = null;
  }

  async init() {
    if (this.audioContext) return;

    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;

      // Define sound files
      const soundFiles = {
        click: "/sounds/click.mp3",
        success: "/sounds/success.mp3",
        error: "/sounds/error.mp3",
        notification: "/sounds/notification.mp3",
        toggle: "/sounds/toggle.mp3",
        whoosh: "/sounds/whoosh.mp3",
        completion: "/sounds/completion.mp3",
      };

      // Preload sounds
      for (const [name, path] of Object.entries(soundFiles)) {
        try {
          const response = await fetch(path);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(
            arrayBuffer
          );
          this.sounds[name] = audioBuffer;
        } catch (error) {
          console.warn(`Failed to load sound: ${name}`, error);
        }
      }
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
    }
  }

  play(soundName) {
    if (!this.enabled || !this.audioContext || !this.sounds[soundName]) return;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.sounds[soundName];
      source.connect(this.gainNode);
      source.start(0);
    } catch (error) {
      console.error(`Error playing sound ${soundName}:`, error);
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem("soundEnabled", this.enabled);
    if (this.enabled) this.play("toggle");
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.gainNode) {
      this.gainNode.gain.value = volume;
    }
    localStorage.setItem("soundVolume", volume);
  }
}

export const ThemeProvider = ({ children }) => {
  // Initialize theme state
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Initialize sound manager
  const [soundManager] = useState(() => new SoundManager());
  const [soundEnabled, setSoundEnabled] = useState(soundManager.enabled);
  const [volume, setVolume] = useState(soundManager.volume);

  // Initialize sound system
  useEffect(() => {
    soundManager.init().catch(console.error);
  }, [soundManager]);

  // Apply theme changes
  useEffect(() => {
    const theme = isDark ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    // Apply theme class to body for Tailwind dark mode
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    console.log(`Theme changed to: ${theme}`);
  }, [isDark]);

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => {
      const hasStoredPreference = localStorage.getItem("theme");
      if (!hasStoredPreference) {
        setIsDark(e.matches);
      }
    };

    // Use the correct event listener method
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handler);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handler);
      }
    };
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
    soundManager.play("toggle");
  };

  const toggleSound = () => {
    soundManager.toggle();
    setSoundEnabled(soundManager.enabled);
    soundManager.play("toggle");
  };

  const updateVolume = (newVolume) => {
    soundManager.setVolume(newVolume);
    setVolume(newVolume);
  };

  const themeValue = {
    isDark,
    toggleTheme,
  };

  const soundValue = {
    enabled: soundEnabled,
    volume,
    toggleSound,
    updateVolume,
    playSound: (sound) => soundManager.play(sound),
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <SoundContext.Provider value={soundValue}>
        {children}
      </SoundContext.Provider>
    </ThemeContext.Provider>
  );
};

// Custom hooks for using theme and sound
export const useTheme = () => useContext(ThemeContext);
export const useSound = () => useContext(SoundContext);

export default ThemeProvider;
