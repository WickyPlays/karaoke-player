import { BaseDirectory, join, resourceDir } from '@tauri-apps/api/path';
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
  const resDir = await resourceDir();
  const dir = await readDir('backgrounds', { baseDir: BaseDirectory.Resource });

  const bgDirs = await Promise.all(
    dir.map(file => join(resDir, `backgrounds/${file.name}`))
  );
  return bgDirs
}
