import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'PlaceBoard';

/**
 * Upload bill image to Supabase storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} userId - User ID for organizing files
 * @returns {Promise<Object>} - { success: boolean, url: string, error: string }
 */
export async function uploadBillImage(fileBuffer, fileName, userId) {
    try {
        // Create unique file path: bills/{userId}/{timestamp}-{fileName}
        const timestamp = Date.now();
        const filePath = `bills/${userId}/${timestamp}-${fileName}`;

        // Upload file to Supabase storage
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileBuffer, {
                contentType: 'image/jpeg',
                upsert: false
            });

        if (error) {
            console.error('Supabase upload error:', error);
            return { success: false, url: null, error: error.message };
        }

        // Get signed URL for private bucket (expires in 1 year)
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(filePath, 31536000); // 1 year in seconds

        if (signedUrlError) {
            console.error('Supabase signed URL error:', signedUrlError);
            return { success: false, url: null, error: signedUrlError.message };
        }

        return { success: true, url: signedUrlData.signedUrl, error: null };
    } catch (error) {
        console.error('Upload bill image error:', error);
        return { success: false, url: null, error: error.message };
    }
}

/**
 * Delete bill image from Supabase storage
 * @param {string} fileUrl - Public URL of the file
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function deleteBillImage(fileUrl) {
    try {
        // Extract file path from URL
        const urlParts = fileUrl.split(`${BUCKET_NAME}/`);
        if (urlParts.length < 2) {
            return { success: false, error: 'Invalid file URL' };
        }

        const filePath = urlParts[1];

        // Delete file from Supabase storage
        const { error } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([filePath]);

        if (error) {
            console.error('Supabase delete error:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (error) {
        console.error('Delete bill image error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload multiple bill images
 * @param {Array} files - Array of { buffer: Buffer, fileName: string }
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of { success: boolean, url: string, error: string, fileName: string }
 */
export async function uploadMultipleBillImages(files, userId) {
    const uploadPromises = files.map(file => 
        uploadBillImage(file.buffer, file.fileName, userId)
            .then(result => ({ ...result, fileName: file.fileName }))
    );

    return Promise.all(uploadPromises);
}

export default {
    uploadBillImage,
    deleteBillImage,
    uploadMultipleBillImages
};
