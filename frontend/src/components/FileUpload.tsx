import React, { useState, useRef } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { uploadKycDocument, deleteKycDocument, validateImageFile } from '../utils/fileUpload';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface FileUploadProps {
  label: string;
  description: string;
  documentType: 'front' | 'back' | 'selfie';
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  description,
  documentType,
  value,
  onChange,
  required = false
}) => {
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!user) return;

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setUploading(true);

    try {
      // Delete old file if exists
      if (value) {
        await deleteKycDocument(value);
      }

      // Upload new file - use user.id (not userId)
      const result = await uploadKycDocument(file, user.id, documentType);
      
      if (result.success && result.url) {
        onChange(result.url);
        toast.success('File uploaded successfully');
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleRemove = async () => {
    if (value) {
      const success = await deleteKycDocument(value);
      if (success) {
        onChange('');
        toast.success('File removed');
      }
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
          ${dragOver 
            ? 'border-blue-400 bg-blue-500/10' 
            : value 
              ? 'border-green-500/50 bg-green-500/5' 
              : 'border-slate-600 bg-slate-700/30 hover:border-blue-400 hover:bg-slate-700/50'
          }
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!uploading ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-sm text-slate-400">Uploading...</p>
          </div>
        ) : value ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <Check className="w-6 h-6 text-green-400" />
              <span className="text-sm font-medium text-green-400">File Uploaded</span>
            </div>
            
            {/* Image Preview */}
            <div className="relative inline-block">
              <img
                src={value}
                alt={label}
                className="w-24 h-24 object-cover rounded-lg border border-slate-600"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            <p className="text-xs text-slate-400">Click to replace</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
            <div className="text-xs text-slate-500">
              <p>Click to browse or drag & drop</p>
              <p>JPEG, PNG, WebP (max 5MB)</p>
            </div>
          </div>
        )}

        {/* Upload Requirements */}
        <div className="mt-3 text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>Ensure document is clear and readable</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <AlertCircle className="w-3 h-3" />
            <span>All corners should be visible</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;