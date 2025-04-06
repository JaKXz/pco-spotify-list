import { browser } from "$app/environment";

export function useLocalStorage<T>(key: string, value?: T) {
  if (!browser) return;

  if (value) {
    $effect(() => {
      localStorage.setItem(key, JSON.stringify(value));
    });

    return value;
  }

  const storedValue = localStorage.getItem(key);
  if (storedValue) {
    return JSON.parse(storedValue) as T;
  }
}
