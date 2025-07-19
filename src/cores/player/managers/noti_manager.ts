export class NotiManager {
  private static _instance: NotiManager;

  static instance(): NotiManager {
    if (!NotiManager._instance) {
      NotiManager._instance = new NotiManager();
    }
    return NotiManager._instance;
  }
}
