import { Vehicle } from '@/types';

export interface QRCodeData {
  id: string;
  licensePlate: string;
  barcode: string;
  make: string;
  model: string;
  year: number;
  status: string;
  expirationDate: string;
}

export const qrCodeGenerator = {
  // Create QR code data object from vehicle
  createQRData(vehicle: Vehicle): QRCodeData {
    return {
      id: vehicle.id,
      licensePlate: vehicle.licensePlate,
      barcode: vehicle.barcode,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status,
      expirationDate: vehicle.expirationDate.toISOString(),
    };
  },

  // Convert QR data to JSON string
  encodeQRData(vehicle: Vehicle): string {
    const qrData = this.createQRData(vehicle);
    return JSON.stringify(qrData);
  },

  // Parse QR code JSON string back to data
  decodeQRData(qrString: string): QRCodeData | null {
    try {
      const data = JSON.parse(qrString);
      
      // Validate required fields
      if (!data.id || !data.licensePlate || !data.barcode) {
        return null;
      }
      
      return data as QRCodeData;
    } catch (error) {
      console.error('Error decoding QR data:', error);
      return null;
    }
  },

  // Generate QR code URL using a QR code service
  generateQRCodeURL(vehicle: Vehicle, size: number = 200): string {
    const qrData = this.encodeQRData(vehicle);
    const encodedData = encodeURIComponent(qrData);
    
    // Using QR Server API (free service)
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
  },

  // Generate QR code URL with custom styling
  generateStyledQRCodeURL(vehicle: Vehicle, options: {
    size?: number;
    color?: string;
    bgcolor?: string;
    format?: 'png' | 'gif' | 'jpeg' | 'jpg' | 'svg';
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  } = {}): string {
    const {
      size = 200,
      color = '000000',
      bgcolor = 'ffffff',
      format = 'png',
      errorCorrectionLevel = 'M'
    } = options;

    const qrData = this.encodeQRData(vehicle);
    const encodedData = encodeURIComponent(qrData);
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&color=${color}&bgcolor=${bgcolor}&format=${format}&ecc=${errorCorrectionLevel}`;
  },

  // Generate QR code for vehicle registration display
  generateRegistrationQR(vehicle: Vehicle): string {
    return this.generateStyledQRCodeURL(vehicle, {
      size: 300,
      color: '1E40AF', // Blue color matching app theme
      bgcolor: 'ffffff',
      format: 'png',
      errorCorrectionLevel: 'H' // High error correction for better scanning
    });
  },

  // Generate compact QR code for mobile display
  generateMobileQR(vehicle: Vehicle): string {
    return this.generateStyledQRCodeURL(vehicle, {
      size: 150,
      color: '000000',
      bgcolor: 'ffffff',
      format: 'png',
      errorCorrectionLevel: 'M'
    });
  },

  // Generate QR code with vehicle info overlay (using a more advanced service)
  generateQRWithInfo(vehicle: Vehicle): string {
    // For a more advanced implementation, you might use a service that allows
    // adding text overlays or logos to QR codes
    const qrData = this.encodeQRData(vehicle);
    const encodedData = encodeURIComponent(qrData);
    
    // This is a basic implementation - in production you might want to use
    // a service that supports custom branding
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}&color=1E40AF&bgcolor=F8FAFC&ecc=H`;
  },

  // Validate QR code data structure
  validateQRData(data: any): data is QRCodeData {
    return (
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.licensePlate === 'string' &&
      typeof data.barcode === 'string' &&
      typeof data.make === 'string' &&
      typeof data.model === 'string' &&
      typeof data.year === 'number' &&
      typeof data.status === 'string' &&
      typeof data.expirationDate === 'string'
    );
  },

  // Create printable QR code data for physical display
  createPrintableQRData(vehicle: Vehicle): {
    qrCodeURL: string;
    displayText: string;
    vehicleInfo: string;
  } {
    const qrCodeURL = this.generateRegistrationQR(vehicle);
    const displayText = `${vehicle.licensePlate} - ${vehicle.barcode}`;
    const vehicleInfo = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
    
    return {
      qrCodeURL,
      displayText,
      vehicleInfo
    };
  },

  // Generate QR code for inspector scanning with minimal data
  generateInspectorQR(vehicle: Vehicle): string {
    // Simplified data for faster scanning
    const inspectorData = {
      id: vehicle.id,
      plate: vehicle.licensePlate,
      barcode: vehicle.barcode,
      status: vehicle.status
    };
    
    const encodedData = encodeURIComponent(JSON.stringify(inspectorData));
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}&ecc=H`;
  }
};