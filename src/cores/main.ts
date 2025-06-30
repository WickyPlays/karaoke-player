import { BaseDirectory, resourceDir } from '@tauri-apps/api/path';
import { exists, mkdir } from '@tauri-apps/plugin-fs';

export async function loadDefaultData() {
  const songsFolder = 'songs'
  const backgroundFolder = 'backgrounds';

  try {

    if (!await exists(songsFolder, { baseDir: BaseDirectory.Resource })) {
      await mkdir(songsFolder, { baseDir: BaseDirectory.Resource });
      console.log("Created song folder!");
    }
    
    if (!await exists(backgroundFolder, { baseDir: BaseDirectory.Resource })) {
      await mkdir(backgroundFolder, { baseDir: BaseDirectory.Resource });
      console.log("Created backgrounds folder!");
    }
  } catch (error) {
    console.error('Error creating default folders:', error);
    throw error;
  }
}