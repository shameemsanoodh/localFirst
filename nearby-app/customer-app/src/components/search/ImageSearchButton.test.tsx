import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageSearchButton } from './ImageSearchButton';
import { analyticsService } from '@/services/analytics.service';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';

// Mock dependencies
vi.mock('@/services/analytics.service', () => ({
  analyticsService: {
    trackImageSearchInitiated: vi.fn(),
    trackImageSearchCompleted: vi.fn(),
    trackImageSearchFailed: vi.fn(),
  },
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/store/locationStore', () => ({
  useLocationStore: vi.fn(),
}));

describe('ImageSearchButton', () => {
  const mockOnImageSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default store mocks
    (useAuthStore as any).mockReturnValue({
      user: { userId: 'test-user-123' },
    });
    
    (useLocationStore as any).mockReturnValue({
      lat: 12.9716,
      lng: 77.5946,
      area: 'Koramangala',
      city: 'Bangalore',
    });
  });

  it('renders camera button', () => {
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const button = screen.getByRole('button', { name: /search by image/i });
    expect(button).toBeInTheDocument();
  });

  it('opens file picker when clicked', () => {
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const button = screen.getByRole('button', { name: /search by image/i });
    const fileInput = screen.getByLabelText(/select image file/i);
    
    const clickSpy = vi.spyOn(fileInput, 'click');
    
    fireEvent.click(button);
    
    expect(clickSpy).toHaveBeenCalled();
    expect(analyticsService.trackImageSearchInitiated).toHaveBeenCalledWith({
      userId: 'test-user-123',
      location: {
        lat: 12.9716,
        lng: 77.5946,
        area: 'Koramangala',
        city: 'Bangalore',
      },
    });
  });

  it('validates file size', async () => {
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const fileInput = screen.getByLabelText(/select image file/i) as HTMLInputElement;
    
    // Create a file larger than 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(analyticsService.trackImageSearchFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'validation-error',
          errorMessage: 'Image too large. Please select an image smaller than 5MB.',
        })
      );
    });
  });

  it('validates file format', async () => {
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const fileInput = screen.getByLabelText(/select image file/i) as HTMLInputElement;
    
    // Create an unsupported file type
    const invalidFile = new File(['test'], 'test.pdf', {
      type: 'application/pdf',
    });
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(analyticsService.trackImageSearchFailed).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'validation-error',
          errorMessage: 'Unsupported format. Please use JPG, PNG, or WEBP.',
        })
      );
    });
  });

  it('shows preview modal for valid image', async () => {
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const fileInput = screen.getByLabelText(/select image file/i) as HTMLInputElement;
    
    // Create a valid image file
    const validFile = new File(['test'], 'test.jpg', {
      type: 'image/jpeg',
    });
    
    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,test',
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // Trigger FileReader onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Product Image')).toBeInTheDocument();
    });
  });

  it('handles cancel button in preview modal', async () => {
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const fileInput = screen.getByLabelText(/select image file/i) as HTMLInputElement;
    
    const validFile = new File(['test'], 'test.jpg', {
      type: 'image/jpeg',
    });
    
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,test',
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Product Image')).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText('Product Image')).not.toBeInTheDocument();
    });
  });

  it('calls onImageSelected when search button clicked', async () => {
    mockOnImageSelected.mockResolvedValue(undefined);
    
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const fileInput = screen.getByLabelText(/select image file/i) as HTMLInputElement;
    
    const validFile = new File(['test'], 'test.jpg', {
      type: 'image/jpeg',
    });
    
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,test',
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Product Image')).toBeInTheDocument();
    });
    
    const buttons = screen.getAllByRole('button');
    const searchButton = buttons.find(btn => btn.textContent?.includes('Search'));
    expect(searchButton).toBeDefined();
    fireEvent.click(searchButton!);
    
    await waitFor(() => {
      expect(mockOnImageSelected).toHaveBeenCalledWith(
        'data:image/jpeg;base64,test',
        validFile
      );
    });
  });

  it('disables button when disabled prop is true', () => {
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} disabled />);
    
    const button = screen.getByRole('button', { name: /search by image/i });
    expect(button).toBeDisabled();
  });

  it('tracks analytics on successful upload', async () => {
    mockOnImageSelected.mockResolvedValue(undefined);
    
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const fileInput = screen.getByLabelText(/select image file/i) as HTMLInputElement;
    
    const validFile = new File(['test'], 'test.jpg', {
      type: 'image/jpeg',
    });
    
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,test',
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Product Image')).toBeInTheDocument();
    });
    
    const buttons = screen.getAllByRole('button');
    const searchButton = buttons.find(btn => btn.textContent?.includes('Search'));
    expect(searchButton).toBeDefined();
    fireEvent.click(searchButton!);
    
    await waitFor(() => {
      expect(analyticsService.trackImageSearchCompleted).toHaveBeenCalledWith({
        userId: 'test-user-123',
        fileSize: validFile.size,
        fileType: validFile.type,
        location: {
          lat: 12.9716,
          lng: 77.5946,
          area: 'Koramangala',
          city: 'Bangalore',
        },
      });
    });
  });

  it('handles upload errors', async () => {
    const error = new Error('Upload failed');
    mockOnImageSelected.mockRejectedValue(error);
    
    render(<ImageSearchButton onImageSelected={mockOnImageSelected} />);
    
    const fileInput = screen.getByLabelText(/select image file/i) as HTMLInputElement;
    
    const validFile = new File(['test'], 'test.jpg', {
      type: 'image/jpeg',
    });
    
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,test',
    };
    
    global.FileReader = vi.fn(() => mockFileReader) as any;
    
    Object.defineProperty(fileInput, 'files', {
      value: [validFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: mockFileReader } as any);
    }
    
    await waitFor(() => {
      expect(screen.getByText('Product Image')).toBeInTheDocument();
    });
    
    const buttons = screen.getAllByRole('button');
    const searchButton = buttons.find(btn => btn.textContent?.includes('Search'));
    expect(searchButton).toBeDefined();
    fireEvent.click(searchButton!);
    
    await waitFor(() => {
      expect(analyticsService.trackImageSearchFailed).toHaveBeenCalledWith({
        userId: 'test-user-123',
        errorCode: 'upload-error',
        errorMessage: 'Upload failed',
        location: {
          lat: 12.9716,
          lng: 77.5946,
          area: 'Koramangala',
          city: 'Bangalore',
        },
      });
    });
  });
});
