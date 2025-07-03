import { BaseDirectory } from '@tauri-apps/api/path';
import { exists, mkdir, readDir, readFile } from '@tauri-apps/plugin-fs';
import { convertFileSrc } from '@tauri-apps/api/core';

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

export async function loadBackgrounds() {
  const dir = await readDir('backgrounds', { baseDir: BaseDirectory.Resource });
  const bgs = []

  for (let i = 0; i < dir.length; i++) {
    const buffer = await readFile(`backgrounds/${dir[i].name}`, { baseDir: BaseDirectory.Resource });
    const blob = new Blob([buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    bgs.push(url);
  }

  return bgs;
}