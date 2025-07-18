import { LocalStorage } from 'quasar';

export class Store {
  public static getStore(key: string): string | number | boolean | null {
    return LocalStorage.getItem(key);
  }

  public static setStore(key: string, value: string | number | boolean) {
    return LocalStorage.set(key, value);
  }
}
