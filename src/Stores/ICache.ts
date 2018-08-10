export interface ICache {
  put(key: string, value: any, time?: number);
  get(key: string);
  del(key: string);
  clear();
  exportJson();
  keys();
}
