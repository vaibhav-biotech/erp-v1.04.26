const axios = require('axios');

const extractDriveFileId = (urlOrId) => {
  try {
    // If it's already just an ID (33 chars alphanumeric, dashes, underscores)
    if (/^[a-zA-Z0-9-_]{33}$/.test(urlOrId)) {
      return urlOrId;
    }

    // Format: https://drive.google.com/file/d/FILE_ID/view
    const match1 = urlOrId.match(/\/d\/([a-zA-Z0-9-_]+)(\/?)/);
    if (match1) return match1[1];

    // Format: https://drive.google.com/open?id=FILE_ID
    const match2 = urlOrId.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (match2) return match2[1];

    // Format: https://drive.google.com/uc?id=FILE_ID
    const match3 = urlOrId.match(/uc\?id=([a-zA-Z0-9-_]+)/);
    if (match3) return match3[1];

    // Format: https://drive.google.com/uc?export=download&id=FILE_ID
    const match4 = urlOrId.match(/id=([a-zA-Z0-9-_]+)/);
    if (match4) return match4[1];

    return null;
  } catch (error) {
    console.error('Error extracting Drive File ID:', error);
    return null;
  }
};

/**
 * Downloads file from Google Drive
 * Works with publicly shared files
 * Returns buffer that can be uploaded to S3
 */
const downloadFromGoogleDrive = async (fileIdOrUrl) => {
  try {
    const fileId = extractDriveFileId(fileIdOrUrl);

    if (!fileId) {
      return {
        success: false,
        error: 'Invalid Google Drive URL or File ID format'
      };
    }

    // Google Drive direct download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const buffer = Buffer.from(response.data);

    // Validate that we actually got an image
    if (buffer.length === 0) {
      return {
        success: false,
        error: 'Downloaded file is empty'
      };
    }

    return {
      success: true,
      buffer
    };
  } catch (error) {
    console.error('Google Drive Download Error:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to download file from Google Drive'
    };
  }
};

/**
 * Converts Google Drive share URL to downloadable proxy URL
 * Useful for direct image display in frontend
 * Format: https://lh3.google.com/d/FILE_ID=w800
 */
const convertToGoogleDriveProxyUrl = (urlOrId) => {
  try {
    const fileId = extractDriveFileId(urlOrId);
    if (!fileId) return null;
    return `https://lh3.google.com/d/${fileId}=w800`;
  } catch (error) {
    console.error('Error converting to proxy URL:', error);
    return null;
  }
};

module.exports = {
  extractDriveFileId,
  downloadFromGoogleDrive,
  convertToGoogleDriveProxyUrl
};
