export type PrinterOrderStatus = 'Pending' | 'Accepted' | 'Printing' | 'Completed' | 'Rejected';

export interface PrinterOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  fabric: string;
  printMethod: string;
  quantity: number;
  status: PrinterOrderStatus;
}

export interface PrinterProfile {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  address: string;
  supportedFabrics: string[];
  supportedPrintMethods: string[];
}

export const orderStatusOptions: PrinterOrderStatus[] = ['Pending', 'Accepted', 'Printing', 'Completed', 'Rejected'];

export const mockPrinterOrders: PrinterOrder[] = [
  { id: 'o1', orderNumber: 'PR-1001', customerName: 'Mia Carter', fabric: 'Cotton', printMethod: 'DTG', quantity: 120, status: 'Pending' },
  { id: 'o2', orderNumber: 'PR-1002', customerName: 'Noah Diaz', fabric: 'Polyester', printMethod: 'Screen Printing', quantity: 320, status: 'Accepted' },
  { id: 'o3', orderNumber: 'PR-1003', customerName: 'Liam Chen', fabric: 'Nylon', printMethod: 'Sublimation', quantity: 80, status: 'Printing' },
  { id: 'o4', orderNumber: 'PR-1004', customerName: 'Ava Patel', fabric: 'Silk', printMethod: 'Embroidery', quantity: 45, status: 'Completed' },
  { id: 'o5', orderNumber: 'PR-1005', customerName: 'Ethan Moore', fabric: 'Cotton', printMethod: 'DTG', quantity: 200, status: 'Rejected' },
];

export const mockPrinterProfile: PrinterProfile = {
  name: 'Aurora Print Studio',
  email: 'contact@auroraprint.com',
  phone: '+1 (555) 234-9876',
  companyName: 'Aurora Print Studio',
  address: '128 Artisan Blvd, Portland, OR 97205',
  supportedFabrics: ['Cotton', 'Polyester'],
  supportedPrintMethods: ['DTG', 'Sublimation'],
};

export const printerFabricOptions = ['Cotton', 'Polyester', 'Nylon', 'Silk'];
export const printerMethodOptions = ['Screen Printing', 'DTG', 'Sublimation', 'Embroidery'];
