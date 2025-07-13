import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

export interface DocumentResult {
  uri: string;
  name: string;
  size: number;
  mimeType: string;
}

export const documentService = {
  async pickDocument(): Promise<DocumentResult | null> {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll simulate document picking
        return {
          uri: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=400',
          name: 'sample_document.pdf',
          size: 1024000,
          mimeType: 'application/pdf',
        };
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          name: asset.name,
          size: asset.size || 0,
          mimeType: asset.mimeType || 'application/octet-stream',
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking document:', error);
      return null;
    }
  },

  async pickImage(): Promise<DocumentResult | null> {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll simulate image picking
        return {
          uri: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400',
          name: 'sample_image.jpg',
          size: 512000,
          mimeType: 'image/jpeg',
        };
      }

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access media library was denied');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          name: `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          mimeType: 'image/jpeg',
        };
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      return null;
    }
  },

  async takePhoto(): Promise<DocumentResult | null> {
    try {
      if (Platform.OS === 'web') {
        // For web, we'll simulate taking a photo
        return {
          uri: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400',
          name: 'camera_photo.jpg',
          size: 512000,
          mimeType: 'image/jpeg',
        };
      }

      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Permission to access camera was denied');
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          mimeType: 'image/jpeg',
        };
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      return null;
    }
  },

  async saveDocument(document: DocumentResult, vehicleId: string): Promise<string> {
    try {
      // Convert URI to blob/file for upload
      let fileData: File | Blob;
      
      if (Platform.OS === 'web') {
        // For web, create a File object
        const response = await fetch(document.uri);
        const blob = await response.blob();
        fileData = new File([blob], document.name, { type: document.mimeType });
      } else {
        // For mobile, convert URI to blob
        const response = await fetch(document.uri);
        fileData = await response.blob();
      }
      
      // Generate unique filename
      const timestamp = Date.now();
      const extension = document.name.split('.').pop() || 'file';
      const filename = `documents/${vehicleId}/${timestamp}.${extension}`;

      // Upload to Supabase Storage bucket
      const { data, error } = await supabase.storage
        .from('vehicle-documents')
        .upload(filename, fileData, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vehicle-documents')
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  },

  async deleteDocument(url: string): Promise<void> {
    try {
      // Extract file path from public URL
      const urlParts = url.split('/storage/v1/object/public/vehicle-documents/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL format');
      }
      
      const filePath = urlParts[1];
      
      const { error } = await supabase.storage
        .from('vehicle-documents')
        .remove([filePath]);
        
      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      // Don't throw here as it's not critical if delete fails
    }
  },

  validateFileSize(size: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  },

  validateFileType(mimeType: string, allowedTypes: string[] = ['application/pdf', 'image/jpeg', 'image/png']): boolean {
    return allowedTypes.includes(mimeType);
  },
};