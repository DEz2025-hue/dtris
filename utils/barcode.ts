export function generateBarcode(licensePlate: string): string {
  // Generate a unique barcode based on license plate and timestamp
  const timestamp = Date.now();
  const combined = `${licensePlate}_${timestamp}`;
  
  // Simple hash function to create a barcode-like string
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and format as barcode
  const positiveHash = Math.abs(hash);
  return `LR${positiveHash.toString().padStart(12, '0')}`;
}

export function createQRData(vehicle: any): string {
  return JSON.stringify({
    id: vehicle.id,
    licensePlate: vehicle.licensePlate,
    barcode: vehicle.barcode,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
  });
}