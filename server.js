const express = require('express');
const fs = require('fs');
const path = require('path');
const ExifParser = require('exif-parser');

const app = express();

// Load settings
const settings = JSON.parse(fs.readFileSync('./settings.json', 'utf8'));

const PHOTOS_PATH = settings.photosPath;
const SUPPORTED_IMAGES = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const SUPPORTED_VIDEOS = ['.mp4', '.webm', '.ogg', '.mov'];
const SUPPORTED_EXTENSIONS = [...SUPPORTED_IMAGES, ...SUPPORTED_VIDEOS];

// Serve static files
app.use(express.static('public'));
app.use('/photos', express.static(PHOTOS_PATH));

// Get settings endpoint
app.get('/api/settings', (req, res) => {
  res.json({
    gridColumns: settings.gridColumns,
    gridRows: settings.gridRows,
    minDuration: settings.minDuration,
    maxDuration: settings.maxDuration,
    transitionDuration: settings.transitionDuration,
    language: settings.language || 'en'
  });
});

// Extract date from filename patterns like: 2023-05-15, 20230515, IMG_20230515, etc.
function extractDateFromFilename(filename) {
  // Pattern: YYYY-MM-DD or YYYYMMDD
  let match = filename.match(/(\d{4})[-_]?(\d{2})[-_]?(\d{2})/);
  if (match) {
    const year = parseInt(match[1]);
    const month = parseInt(match[2]);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }
  
  // Pattern: DD-MM-YYYY or DDMMYYYY
  match = filename.match(/(\d{2})[-_]?(\d{2})[-_]?(\d{4})/);
  if (match) {
    const day = parseInt(match[1]);
    const month = parseInt(match[2]);
    const year = parseInt(match[3]);
    if (year >= 1900 && year <= 2100 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }
  
  return null;
}

// Extract date from EXIF data
function extractDateFromExif(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const parser = ExifParser.create(buffer);
    const result = parser.parse();
    
    if (result.tags && result.tags.DateTimeOriginal) {
      const date = new Date(result.tags.DateTimeOriginal * 1000);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1
      };
    }
    
    if (result.tags && result.tags.CreateDate) {
      const date = new Date(result.tags.CreateDate * 1000);
      return {
        year: date.getFullYear(),
        month: date.getMonth() + 1
      };
    }
  } catch (err) {
    // EXIF parsing failed, return null
  }
  return null;
}

// Get file modification date as fallback
function getFileDateFallback(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const date = new Date(stats.mtime);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1
    };
  } catch (err) {
    return null;
  }
}

// Recursively get all media files
function getMediaFiles(dir, baseDir = dir) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(getMediaFiles(fullPath, baseDir));
      } else {
        const ext = path.extname(item).toLowerCase();
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          const relativePath = path.relative(baseDir, fullPath);
          const isVideo = SUPPORTED_VIDEOS.includes(ext);
          
          // Try to get date info
          let dateInfo = extractDateFromFilename(item);
          
          if (!dateInfo && !isVideo) {
            dateInfo = extractDateFromExif(fullPath);
          }
          
          if (!dateInfo) {
            dateInfo = getFileDateFallback(fullPath);
          }
          
          files.push({
            path: '/photos/' + relativePath.replace(/\\/g, '/'),
            filename: item,
            isVideo: isVideo,
            date: dateInfo
          });
        }
      }
    }
  } catch (err) {
    console.error('Error reading directory:', err);
  }
  
  return files;
}

// API endpoint to get all media files
app.get('/api/media', (req, res) => {
  const files = getMediaFiles(PHOTOS_PATH);
  res.json(files);
});

// Start server
const PORT = settings.port || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Slideshow server running at http://localhost:${PORT}`);
  console.log(`Photos path: ${path.resolve(PHOTOS_PATH)}`);
  console.log(`Grid: ${settings.gridColumns}x${settings.gridRows}`);
  console.log(`Duration: ${settings.minDuration}s - ${settings.maxDuration}s`);
});
