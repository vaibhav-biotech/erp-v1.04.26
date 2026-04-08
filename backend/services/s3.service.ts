import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}


export const uploadImageToS3 = async (
  fileBuffer: Buffer,
  fileName: string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> => {
  try {
    // Generate unique file name
    const timestamp = Date.now();
    const randomId = uuidv4();
    const fileExtension = fileName.split('.').pop();
    const uniqueFileName = `products/${timestamp}-${randomId}.${fileExtension}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME || '',
      Key: uniqueFileName,
      Body: fileBuffer,
      ContentType: contentType
    };

    const result = await s3.upload(params).promise();

    return {
      success: true,
      url: result.Location
    };
  } catch (error: any) {
    console.error('S3 Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload image to S3'
    };
  }
};

export const deleteImageFromS3 = async (imageUrl: string): Promise<UploadResult> => {
  try {
    // Extract key from URL
    const url = new URL(imageUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME || '',
      Key: key
    };

    await s3.deleteObject(params).promise();

    return {
      success: true
    };
  } catch (error: any) {
    console.error('S3 Delete Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete image from S3'
    };
  }
};

export const getS3Client = () => s3;
