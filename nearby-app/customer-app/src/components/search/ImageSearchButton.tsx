import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { analyticsService } from '@/services/analytics.service';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

export interface ImageSearchButtonProps {
  onImageSelected: (imageData: string, file: File) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageSearchButton: React.FC<ImageSearchButtonProps> = ({
  onImageSelected,
  disabled = false,
  className = '',
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showErrorTooltip, setShowErrorTooltip] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { lat, lng, area, city } = useLocationStore();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];

  const handleButtonClick = () => {
    if (disabled) return;

    // Track image search initiated
    analyticsService.trackImageSearchInitiated({
      userId: user?.userId,
      location: lat && lng ? { lat, lng, area, city } : undefined,
    });

    fileInputRef.current?.click();
  };

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      return 'Unsupported format. Please use JPG, PNG, or WEBP.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return 'Image too large. Please select an image smaller than 5MB.';
    }

    return null;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setShowErrorTooltip(true);
      setTimeout(() => setShowErrorTooltip(false), 5000);

      // Track validation error
      analyticsService.trackImageSearchFailed({
        userId: user?.userId,
        errorCode: 'validation-error',
        errorMessage: validationError,
        location: lat && lng ? { lat, lng, area, city } : undefined,
      });

      // Reset input
      event.target.value = '';
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
      setSelectedFile(file);
      setShowPreviewModal(true);
      setError(null);
      setUploadProgress(0);
    };
    reader.readAsDataURL(file);

    // Reset input for next selection
    event.target.value = '';
  };

  const handleCancel = () => {
    setShowPreviewModal(false);
    setPreviewImage(null);
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setError(null);
  };

  const handleUpload = async () => {
    if (!previewImage || !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Call parent handler
      await onImageSelected(previewImage, selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Track successful upload
      analyticsService.trackImageSearchCompleted({
        userId: user?.userId,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        location: lat && lng ? { lat, lng, area, city } : undefined,
      });

      // Close modal after brief delay
      setTimeout(() => {
        handleCancel();
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);

      // Track upload error
      analyticsService.trackImageSearchFailed({
        userId: user?.userId,
        errorCode: 'upload-error',
        errorMessage,
        location: lat && lng ? { lat, lng, area, city } : undefined,
      });

      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="relative">
      {/* Image Search Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`relative p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-nearby-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label="Search by image"
        title="Upload an image to search"
      >
        <Camera size={20} />
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Select image file"
      />

      {/* Error Tooltip */}
      <AnimatePresence>
        {showErrorTooltip && error && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-lg shadow-lg p-3 z-50"
          >
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-700 mb-1">
                  Image Upload Error
                </p>
                <p className="text-xs text-red-600">{error}</p>
              </div>
              <button
                onClick={() => setShowErrorTooltip(false)}
                className="text-red-400 hover:text-red-600"
                aria-label="Close error message"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  Product Image
                </h3>
                <button
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  aria-label="Close preview"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Image Preview */}
              <div className="relative mb-4 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={previewImage}
                  alt="Selected product"
                  className="w-full h-64 object-contain"
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      AI is analyzing...
                    </span>
                    <span className="text-sm font-semibold text-nearby-500">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-nearby-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && !showErrorTooltip && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Cancel image upload"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2.5 bg-nearby-500 hover:bg-nearby-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label={isUploading ? 'Processing image' : 'Search with image'}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Search
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
