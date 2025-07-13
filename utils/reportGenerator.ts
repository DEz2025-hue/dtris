import { Vehicle, Inspection, Incident, User, PaymentRecord } from '@/types';
import { Platform } from 'react-native';

export interface ReportData {
  vehicles: Vehicle[];
  inspections: Inspection[];
  incidents: Incident[];
  users: User[];
  payments: PaymentRecord[];
  generatedAt: Date;
  generatedBy: string;
}

export const reportGenerator = {
  // Generate CSV content for vehicles
  generateVehiclesCSV(vehicles: Vehicle[]): string {
    const headers = [
      'License Plate',
      'Make',
      'Model',
      'Year',
      'Color',
      'VIN',
      'Status',
      'Registration Date',
      'Expiration Date',
      'Owner ID',
      'Barcode'
    ];

    const rows = vehicles.map(vehicle => [
      vehicle.licensePlate,
      vehicle.make,
      vehicle.model,
      vehicle.year.toString(),
      vehicle.color,
      vehicle.vin,
      vehicle.status,
      vehicle.registrationDate.toLocaleDateString(),
      vehicle.expirationDate.toLocaleDateString(),
      vehicle.ownerId,
      vehicle.barcode
    ]);

    return this.arrayToCSV([headers, ...rows]);
  },

  // Generate CSV content for inspections
  generateInspectionsCSV(inspections: Inspection[], vehicles: Vehicle[]): string {
    const headers = [
      'Inspection ID',
      'License Plate',
      'Inspector Name',
      'Date',
      'Status',
      'Location',
      'Notes',
      'Violations',
      'Next Due Date'
    ];

    const rows = inspections.map(inspection => {
      const vehicle = vehicles.find(v => v.id === inspection.vehicleId);
      return [
        inspection.id,
        vehicle?.licensePlate || 'Unknown',
        inspection.inspectorName,
        inspection.date.toLocaleDateString(),
        inspection.status,
        inspection.location,
        inspection.notes || '',
        inspection.violations.join('; '),
        inspection.nextInspectionDue?.toLocaleDateString() || ''
      ];
    });

    return this.arrayToCSV([headers, ...rows]);
  },

  // Generate CSV content for incidents
  generateIncidentsCSV(incidents: Incident[], vehicles: Vehicle[]): string {
    const headers = [
      'Incident ID',
      'License Plate',
      'Type',
      'Description',
      'Location',
      'Date',
      'Status',
      'Reporter ID'
    ];

    const rows = incidents.map(incident => {
      const vehicle = vehicles.find(v => v.id === incident.vehicleId);
      return [
        incident.id,
        vehicle?.licensePlate || 'N/A',
        incident.type,
        incident.description,
        incident.location,
        incident.date.toLocaleDateString(),
        incident.status,
        incident.reporterId
      ];
    });

    return this.arrayToCSV([headers, ...rows]);
  },

  // Generate compliance report CSV
  generateComplianceCSV(vehicles: Vehicle[], inspections: Inspection[]): string {
    const headers = [
      'License Plate',
      'Make',
      'Model',
      'Status',
      'Last Inspection',
      'Last Inspection Status',
      'Days Until Expiration',
      'Compliance Status'
    ];

    const rows = vehicles.map(vehicle => {
      const vehicleInspections = inspections.filter(i => i.vehicleId === vehicle.id);
      const lastInspection = vehicleInspections.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
      
      const daysUntilExpiration = Math.ceil(
        (vehicle.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      const complianceStatus = vehicle.status === 'active' && daysUntilExpiration > 0 ? 'Compliant' : 'Non-Compliant';

      return [
        vehicle.licensePlate,
        vehicle.make,
        vehicle.model,
        vehicle.status,
        lastInspection?.date.toLocaleDateString() || 'Never',
        lastInspection?.status || 'N/A',
        daysUntilExpiration.toString(),
        complianceStatus
      ];
    });

    return this.arrayToCSV([headers, ...rows]);
  },

  // Generate analytics summary CSV
  generateAnalyticsCSV(data: ReportData): string {
    const totalVehicles = data.vehicles.length;
    const activeVehicles = data.vehicles.filter(v => v.status === 'active').length;
    const expiredVehicles = data.vehicles.filter(v => v.status === 'expired').length;
    const suspendedVehicles = data.vehicles.filter(v => v.status === 'suspended').length;

    const totalInspections = data.inspections.length;
    const passedInspections = data.inspections.filter(i => i.status === 'pass').length;
    const failedInspections = data.inspections.filter(i => i.status === 'fail').length;
    const conditionalInspections = data.inspections.filter(i => i.status === 'conditional').length;

    const totalIncidents = data.incidents.length;
    const reportedIncidents = data.incidents.filter(i => i.status === 'reported').length;
    const resolvedIncidents = data.incidents.filter(i => i.status === 'resolved').length;

    const complianceRate = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(2) : '0';
    const passRate = totalInspections > 0 ? ((passedInspections / totalInspections) * 100).toFixed(2) : '0';

    const analyticsData = [
      ['Metric', 'Value'],
      ['Total Vehicles', totalVehicles.toString()],
      ['Active Vehicles', activeVehicles.toString()],
      ['Expired Vehicles', expiredVehicles.toString()],
      ['Suspended Vehicles', suspendedVehicles.toString()],
      ['Compliance Rate', `${complianceRate}%`],
      [''],
      ['Total Inspections', totalInspections.toString()],
      ['Passed Inspections', passedInspections.toString()],
      ['Failed Inspections', failedInspections.toString()],
      ['Conditional Inspections', conditionalInspections.toString()],
      ['Pass Rate', `${passRate}%`],
      [''],
      ['Total Incidents', totalIncidents.toString()],
      ['Reported Incidents', reportedIncidents.toString()],
      ['Resolved Incidents', resolvedIncidents.toString()],
      [''],
      ['Report Generated', data.generatedAt.toLocaleString()],
      ['Generated By', data.generatedBy]
    ];

    return this.arrayToCSV(analyticsData);
  },

  // Convert array of arrays to CSV string
  arrayToCSV(data: string[][]): string {
    return data.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escaped = cell.replace(/"/g, '""');
        return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    ).join('\n');
  },

  // Download CSV file (web only)
  downloadCSV(content: string, filename: string): void {
    if (Platform.OS !== 'web') {
      console.warn('CSV download is only available on web platform');
      return;
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  },

  // Share CSV content (mobile)
  async shareCSV(content: string, filename: string): Promise<void> {
    if (Platform.OS === 'web') {
      this.downloadCSV(content, filename);
      return;
    }

    // For mobile platforms, you would typically use expo-sharing
    // This is a placeholder for the actual implementation
    console.log('Sharing CSV:', filename);
    console.log('Content length:', content.length);
    
    // In a real implementation, you would:
    // 1. Write the content to a temporary file
    // 2. Use expo-sharing to share the file
    // 3. Clean up the temporary file
  },

  // Generate and download/share vehicle report
  async exportVehicleReport(vehicles: Vehicle[]): Promise<void> {
    const content = this.generateVehiclesCSV(vehicles);
    const filename = `vehicles_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (Platform.OS === 'web') {
      this.downloadCSV(content, filename);
    } else {
      await this.shareCSV(content, filename);
    }
  },

  // Generate and download/share inspection report
  async exportInspectionReport(inspections: Inspection[], vehicles: Vehicle[]): Promise<void> {
    const content = this.generateInspectionsCSV(inspections, vehicles);
    const filename = `inspections_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (Platform.OS === 'web') {
      this.downloadCSV(content, filename);
    } else {
      await this.shareCSV(content, filename);
    }
  },

  // Generate and download/share compliance report
  async exportComplianceReport(vehicles: Vehicle[], inspections: Inspection[]): Promise<void> {
    const content = this.generateComplianceCSV(vehicles, inspections);
    const filename = `compliance_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (Platform.OS === 'web') {
      this.downloadCSV(content, filename);
    } else {
      await this.shareCSV(content, filename);
    }
  },

  // Generate and download/share analytics report
  async exportAnalyticsReport(data: ReportData): Promise<void> {
    const content = this.generateAnalyticsCSV(data);
    const filename = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (Platform.OS === 'web') {
      this.downloadCSV(content, filename);
    } else {
      await this.shareCSV(content, filename);
    }
  },

  // Generate comprehensive system report
  async exportSystemReport(data: ReportData): Promise<void> {
    const reports = [
      { name: 'Analytics', content: this.generateAnalyticsCSV(data) },
      { name: 'Vehicles', content: this.generateVehiclesCSV(data.vehicles) },
      { name: 'Inspections', content: this.generateInspectionsCSV(data.inspections, data.vehicles) },
      { name: 'Incidents', content: this.generateIncidentsCSV(data.incidents, data.vehicles) },
      { name: 'Compliance', content: this.generateComplianceCSV(data.vehicles, data.inspections) }
    ];

    const timestamp = new Date().toISOString().split('T')[0];

    if (Platform.OS === 'web') {
      // Download each report separately on web
      reports.forEach(report => {
        const filename = `${report.name.toLowerCase()}_${timestamp}.csv`;
        this.downloadCSV(report.content, filename);
      });
    } else {
      // On mobile, you might want to create a zip file or share individually
      for (const report of reports) {
        const filename = `${report.name.toLowerCase()}_${timestamp}.csv`;
        await this.shareCSV(report.content, filename);
      }
    }
  }
};