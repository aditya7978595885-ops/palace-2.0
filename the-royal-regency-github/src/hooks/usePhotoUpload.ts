import { useCallback, useState } from 'react';
import { GalleryPhoto } from '../types/palace';
import { processUploadedImage } from '../utils/imageUtils';

interface UsePhotoUploadParams {
  photos: GalleryPhoto[];
  updatePhoto: (id: string, partial: Partial<GalleryPhoto>) => void;
}

export function usePhotoUpload({ photos, updatePhoto }: UsePhotoUploadParams) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const clearError = useCallback(() => setUploadError(null), []);

  const uploadToFrame = useCallback(
    async (frameId: string, file: File): Promise<boolean> => {
      setIsUploading(true);
      setUploadError(null);
      try {
        const processed = await processUploadedImage(file);
        updatePhoto(frameId, {
          dataUrl: processed.dataUrl,
          aspectRatio: processed.aspectRatio,
        });
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to upload photograph.';
        setUploadError(msg);
        return false;
      } finally {
        setIsUploading(false);
      }
    },
    [updatePhoto]
  );

  const uploadMultipleFiles = useCallback(
    async (files: FileList | File[]): Promise<number> => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return 0;

      setIsUploading(true);
      setUploadError(null);
      let uploadedCount = 0;

      try {
        // Fill empty frames first, then overwrite from the start if more files are given
        const emptyIds = photos.filter((p) => !p.dataUrl).map((p) => p.id);
        const targetIds = [
          ...emptyIds,
          ...photos.filter((p) => p.dataUrl).map((p) => p.id),
        ];

        for (let i = 0; i < fileArray.length && i < targetIds.length; i++) {
          const processed = await processUploadedImage(fileArray[i]);
          updatePhoto(targetIds[i], {
            dataUrl: processed.dataUrl,
            aspectRatio: processed.aspectRatio,
          });
          uploadedCount += 1;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'One or more files could not be processed.';
        setUploadError(msg);
      } finally {
        setIsUploading(false);
      }
      return uploadedCount;
    },
    [photos, updatePhoto]
  );

  return {
    isUploading,
    uploadError,
    clearError,
    uploadToFrame,
    uploadMultipleFiles,
  };
}
