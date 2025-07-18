export function isPlatform(
  platform: "android" | "ios" | "linux" | "macos" | "windows"
): boolean {
  switch (platform) {
    case "android":
      return /android/i.test(window.navigator.userAgent);
    case "ios":
      return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    case "linux":
      return /linux/i.test(window.navigator.userAgent);
    case "macos":
      return /macintosh|mac os x/i.test(window.navigator.userAgent);
    case "windows":
      return /windows/i.test(window.navigator.userAgent);
  }
}

export function isPlatformPhone(): boolean {
  return isPlatform("android") || isPlatform("ios");
}

export function isPlatformDesktop(): boolean {
  return isPlatform("linux") || isPlatform("macos") || isPlatform("windows");
}

export function checkPlatform(): string {
  if (isPlatform("android")) {
    return "Android";
  } else if (isPlatform("ios")) {
    return "iOS";
  } else if (isPlatform("linux")) {
    return "Linux";
  } else if (isPlatform("macos")) {
    return "macOS";
  } else if (isPlatform("windows")) {
    return "Windows";
  } else {
    return "Unknown";
  }
}

