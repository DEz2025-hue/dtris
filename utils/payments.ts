import { PaymentRecord } from '@/types';
import { supabaseService } from './supabaseService';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export const paymentService = {
  // Simulate payment processing for beta
  async processPayment(
    userId: string,
    vehicleId: string | undefined,
    amount: number,
    type: 'registration' | 'inspection' | 'insurance' | 'fine',
    description: string
  ): Promise<PaymentRecord> {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate 90% success rate
    const isSuccess = Math.random() > 0.1;

    const payment: PaymentRecord = {
      id: Date.now().toString(),
      userId,
      vehicleId,
      amount,
      type,
      status: isSuccess ? 'completed' : 'failed',
      date: new Date(),
      description,
    };

    // Save payment record
    await supabaseService.addPayment(payment);

    return payment;
  },

  async getPaymentHistory(userId: string): Promise<PaymentRecord[]> {
    const allPayments = await supabaseService.getPayments();
    return allPayments.filter(payment => payment.userId === userId);
  },

  async getVehiclePayments(vehicleId: string): Promise<PaymentRecord[]> {
    const allPayments = await supabaseService.getPayments();
    return allPayments.filter(payment => payment.vehicleId === vehicleId);
  },

  // Calculate fees based on Liberian context
  getRegistrationFee(vehicleYear: number): number {
    const currentYear = new Date().getFullYear();
    const vehicleAge = currentYear - vehicleYear;
    
    // Base fee: $50 USD (converted to LRD approximately)
    let baseFee = 50;
    
    // Older vehicles pay less
    if (vehicleAge > 10) {
      baseFee = 30;
    } else if (vehicleAge > 5) {
      baseFee = 40;
    }
    
    return baseFee;
  },

  getInspectionFee(): number {
    // Standard inspection fee: $25 USD
    return 25;
  },

  getInsuranceFee(vehicleValue: number): number {
    // Insurance based on vehicle value (simplified)
    return Math.max(100, vehicleValue * 0.02); // 2% of vehicle value, minimum $100
  },

  getFineAmount(violationType: string): number {
    const fines: Record<string, number> = {
      'speeding': 75,
      'red_light': 100,
      'illegal_parking': 25,
      'expired_registration': 50,
      'no_insurance': 150,
      'reckless_driving': 200,
      'default': 50,
    };

    return fines[violationType] || fines.default;
  },

  // Format currency for Liberian context
  formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)} USD`;
  },

  // Simulate mobile money integration (common in Liberia)
  async processMobileMoneyPayment(phoneNumber: string, amount: number): Promise<boolean> {
    // Simulate mobile money processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Simulate 95% success rate for mobile money
    return Math.random() > 0.05;
  },

  // Generate payment receipt
  generateReceipt(payment: PaymentRecord): string {
    return `
REPUBLIC OF LIBERIA
Ministry of Transport
Digital Transportation Registration & Inspection System

PAYMENT RECEIPT
================
Receipt #: ${payment.id}
Date: ${payment.date.toLocaleDateString()}
Time: ${payment.date.toLocaleTimeString()}

Payment Type: ${payment.type.toUpperCase()}
Description: ${payment.description}
Amount: ${this.formatCurrency(payment.amount)}
Status: ${payment.status.toUpperCase()}

Vehicle ID: ${payment.vehicleId || 'N/A'}
User ID: ${payment.userId}

Thank you for using DTRIS!
For support, contact: support@dtris.gov.lr
    `.trim();
  },
};