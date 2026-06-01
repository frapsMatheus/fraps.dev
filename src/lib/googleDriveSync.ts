import fs from 'fs';
import path from 'path';

// Google Drive File ID and Folder ID for the Impossible List
const DEFAULT_FILE_ID = `17uOOGGs5_aWKJdJM-3JPOeEOPRYMoWCo`;

/**
 * Fetches a file from Google Drive.
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
 * Helper to compile a callout details/summary block with parsed title formatting.
 */
function formatCalloutBlock(type: string, title: string, content: string, open: boolean): string {
  // Compile inline markdown inside summary title
  const parsedTitle = title
    .replace(/~~([\s\S]+?)~~/g, `<del>$1</del>`)
    .replace(/\*\*([\s\S]+?)\*\*/g, `<strong>$1</strong>`)
    .replace(/\*([\s\S]+?)\*/g, `<em>$1</em>`);

  return [
    `<details ${open ? `open` : ``} class="callout callout-${type}">`,
    `  <summary class="callout-title">${parsedTitle || `Note`}</summary>`,
    `  <div class="callout-content">\n`,
    content,
    `\n  </div>`,
    `</details>`,
  ].join(`\n`);
}

/**
 * Parses Obsidian Callouts (> [!type]+ Title) into HTML <details> tags.
 */
function parseObsidianCallouts(markdown: string): string {
  const lines = markdown.split(`\n`);
  const result: string[] = [];
  let inCallout = false;
  let calloutType = ``;
  let calloutTitle = ``;
  let calloutContent: string[] = [];
  let isOpen = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const calloutHeaderMatch = line.match(/^>\s*\[!([a-zA-Z0-9_-]+)\]([+-]?)\s*(.*)/);

    if (calloutHeaderMatch) {
      if (inCallout) {
        result.push(formatCalloutBlock(calloutType, calloutTitle, calloutContent.join(`\n`), isOpen));
        calloutContent = [];
      }
      inCallout = true;
      const [, typeMatch, openMatch, titleMatch] = calloutHeaderMatch;
      calloutType = typeMatch.toLowerCase();
      isOpen = openMatch === `+`; // Folded (closed) by default; open ONLY if '+' is explicitly specified
      calloutTitle = titleMatch;
    } else if (inCallout && (line.startsWith(`>`) || line.trim() === `>`)) {
      const content = line.startsWith(`>`) ? line.substring(1).replace(/^\s/, ``) : ``;
      calloutContent.push(content);
    } else {
      if (inCallout) {
        result.push(formatCalloutBlock(calloutType, calloutTitle, calloutContent.join(`\n`), isOpen));
        result.push(`\n`);
        inCallout = false;
        calloutContent = [];
      }
      result.push(line);
    }
  }

  if (inCallout) {
    result.push(formatCalloutBlock(calloutType, calloutTitle, calloutContent.join(`\n`), isOpen));
  }

  return result.join(`\n`);
}

/**
 * Scrapes file IDs from a public Google Drive folder page using HTML parsing.
 */
async function fetchFolderFiles(folderId: string): Promise<Array<{ id: string; name: string }>> {
  try {
    const url = `https://drive.google.com/embeddedfolderview?id=${folderId}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const text = await response.text();

    const files: Array<{ id: string; name: string }> = [];
    const linkRegex = /href="https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)\/view/g;
    const linkMatches = Array.from(text.matchAll(linkRegex));

    linkMatches.forEach((linkMatch) => {
      const fileId = linkMatch[1];
      const startIdx = linkMatch.index || 0;
      const subText = text.substring(startIdx, startIdx + 1000);

      const divRegex = /<div[^>]*>([^<]+)<\/div>/g;
      const divMatches = Array.from(subText.matchAll(divRegex));
      let name = ``;
      for (let i = 0; i < divMatches.length; i += 1) {
        const potentialName = divMatches[i][1].trim();
        if (potentialName.match(/\.(jpg|jpeg|png|gif|bmp|webp|pdf|md)$/i)) {
          name = potentialName;
          break;
        }
      }
      if (fileId && name) {
        files.push({ id: fileId, name });
      }
    });

    return files;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching folder files:`, error);
    return [];
  }
}

/**
 * Syncs the markdown content and downloads all referenced images.
 */
export async function syncImpossibleListContent(): Promise<{ markdown: string }> {
  const fileId = process.env.GOOGLE_DRIVE_FILE_ID || DEFAULT_FILE_ID;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID; // Optional folder ID containing all files/images

  // eslint-disable-next-line no-console
  console.log(`Syncing Impossible List from Google Drive ID: ${fileId}`);

  let markdown = await fetchGoogleDriveFile(fileId);

  // Parse Obsidian Callouts to HTML details tags first
  markdown = parseObsidianCallouts(markdown);

  const publicDir = path.join(process.cwd(), `public`);
  const targetDir = path.join(publicDir, `images`, `impossible-list`);

  // 1. Process standard Google Drive links if any
  const drivePatterns = [
    /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/[^\s)"]*)?/g,
    /https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/g,
    /https:\/\/(?:drive|docs)\.google\.com\/uc\?export=download&id=([a-zA-Z0-9_-]+)/g,
  ];

  const uniqueImageIds = new Set<string>();
  drivePatterns.forEach((pattern) => {
    const matches = Array.from(markdown.matchAll(pattern));
    for (let i = 0; i < matches.length; i += 1) {
      const match = matches[i];
      if (match && match[1]) {
        uniqueImageIds.add(match[1]);
      }
    }
  });

  const imageIdsArray = Array.from(uniqueImageIds);
  const downloadPromises = imageIdsArray.map(async (imageId) => {
    const localFileName = `${imageId}.png`;
    const localFilePath = path.join(targetDir, localFileName);
    const localRelativePath = `/images/impossible-list/${localFileName}`;

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

  // 2. Process Obsidian Wikilink attachments: ![[filename.ext]]
  const wikilinkPattern = /!\[\[([a-zA-Z0-9_\s\u00C0-\u00FF.-]+)\]\]/g;
  const wikilinkMatches = Array.from(markdown.matchAll(wikilinkPattern));
  const uniqueWikilinkNames = new Set<string>();

  for (let i = 0; i < wikilinkMatches.length; i += 1) {
    const match = wikilinkMatches[i];
    if (match && match[1]) {
      uniqueWikilinkNames.add(match[1].trim());
    }
  }

  if (uniqueWikilinkNames.size > 0) {
    // eslint-disable-next-line no-console
    console.log(`Found ${uniqueWikilinkNames.size} Obsidian wikilink images:`, Array.from(uniqueWikilinkNames));

    // If a folder ID is supplied, fetch all its files to map Obsidian names to Drive IDs
    const folderFiles = folderId ? await fetchFolderFiles(folderId) : [];
    const nameToIdMap = new Map<string, string>();
    folderFiles.forEach((file) => {
      nameToIdMap.set(file.name.toLowerCase().trim(), file.id);
    });

    const wikilinkNamesArray = Array.from(uniqueWikilinkNames);
    const wikilinkPromises = wikilinkNamesArray.map(async (fileName) => {
      // Find Drive File ID by name matching
      const driveFileId = nameToIdMap.get(fileName.toLowerCase());
      if (!driveFileId) {
        // eslint-disable-next-line no-console
        console.warn(`Could not find Drive File ID for wikilink image: ${fileName}`);
        return { fileName, success: false, localRelativePath: `` };
      }

      // Keep original file extension
      const ext = path.extname(fileName) || `.png`;
      // Clean filename for safety
      const cleanFileName = fileName.replace(/[^a-zA-Z0-9_-]/g, `_`) + ext;
      const localFilePath = path.join(targetDir, cleanFileName);
      const localRelativePath = `/images/impossible-list/${cleanFileName}`;

      const success = await downloadImage(driveFileId, localFilePath);
      return { fileName, success, localRelativePath };
    });

    const wikilinkResults = await Promise.all(wikilinkPromises);

    wikilinkResults.forEach(({ fileName, success, localRelativePath }) => {
      if (success) {
        // Replace ![[filename.ext]] with standard markdown image format
        const escapedName = fileName.replace(/[-/\\^$*+?.()|[\]{}]/g, `\\$&`);
        const specificRegex = new RegExp(`!\\[\\[\\s*${escapedName}\\s*\\]\\]`, `g`);
        markdown = markdown.replace(specificRegex, `![${fileName}](${localRelativePath})`);
      }
    });
  }

  return { markdown };
}
