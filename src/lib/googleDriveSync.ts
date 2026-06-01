import fs from 'fs';
import path from 'path';

// Google Drive File ID for the Impossible List
const DEFAULT_FILE_ID = `17uOOGGs5_aWKJdJM-3JPOeEOPRYMoWCo`;

/**
 * Fetches a file from Google Drive.
 * Works with public files shared as "Anyone with the link can view".
 */
export async function fetchGoogleDriveFile(fileId: string): Promise<string> {
  const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from Google Drive: ${response.statusText}`);
  }
  return response.text();
}

/**
 * Downloads a binary file from Google Drive and saves it locally.
 */
async function downloadImage(fileId: string, destPath: string): Promise<boolean> {
  try {
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(url);
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.error(`Failed to download image ${fileId}: ${response.statusText}`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
    await fs.promises.writeFile(destPath, buffer);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error downloading image ${fileId}:`, error);
    return false;
  }
}

/**
 * Syncs the markdown content and downloads all referenced Google Drive images.
 * Returns the modified markdown content with rewritten image paths.
 */
export async function syncImpossibleListContent(): Promise<{ markdown: string }> {
  const fileId = process.env.GOOGLE_DRIVE_FILE_ID || DEFAULT_FILE_ID;
  // eslint-disable-next-line no-console
  console.log(`Syncing Impossible List from Google Drive ID: ${fileId}`);

  let markdown = await fetchGoogleDriveFile(fileId);

  // RegEx patterns to find Google Drive file/image URLs
  const drivePatterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/[^\s)"]*)?/g,
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/g,
    /https:\/\/(?:drive|docs)\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/g,
  ];

  const uniqueImageIds = new Set<string>();

  // Extract all unique drive image IDs
  drivePatterns.forEach((pattern) => {
    const matches = Array.from(markdown.matchAll(pattern));
    for (let i = 0; i < matches.length; i += 1) {
      const match = matches[i];
      if (match && match[1]) {
        uniqueImageIds.add(match[1]);
      }
    }
  });

  // eslint-disable-next-line no-console
  console.log(`Found ${uniqueImageIds.size} referenced Google Drive images.`);

  // Download images and rewrite paths
  const publicDir = path.join(process.cwd(), `public`);
  const targetDir = path.join(publicDir, `images`, `impossible-list`);

  const imageIdsArray = Array.from(uniqueImageIds);
  const downloadPromises = imageIdsArray.map(async (imageId) => {
    const localFileName = `${imageId}.png`;
    const localFilePath = path.join(targetDir, localFileName);
    const localRelativePath = `/images/impossible-list/${localFileName}`;

    // eslint-disable-next-line no-console
    console.log(`Syncing image ${imageId} to ${localRelativePath}`);
    const success = await downloadImage(imageId, localFilePath);
    return { imageId, success, localRelativePath };
  });

  const results = await Promise.all(downloadPromises);

  results.forEach(({ imageId, success, localRelativePath }) => {
    if (success) {
      drivePatterns.forEach((pattern) => {
        const specificRegex = new RegExp(pattern.source.replace(`([a-zA-Z0-9_-]+)`, imageId), `g`);
        markdown = markdown.replace(specificRegex, localRelativePath);
      });
    }
  });

  return { markdown };
}
