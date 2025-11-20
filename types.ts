
// Replace enum with const object for better compatibility
export const ServiceType = {
  Maintenance: '保养',
  Repair: '维修',
  Fuel: '加油',
  Upgrade: '改装',
  Other: '其他',
} as const;

export type ServiceType = typeof ServiceType[keyof typeof ServiceType];

export const VehicleType = {
  Sedan: '轿车',
  SUV: 'SUV/越野车',
  MPV: 'MPV/商务车',
  Bus: '客车',
  Truck: '货车',
  Motorcycle: '摩托车',
  Special: '特种车',
  Other: '其他',
} as const;

export type VehicleType = typeof VehicleType[keyof typeof VehicleType];

export interface Vehicle {
  id: string;
  type: VehicleType;    // 车辆类型
  make: string;
  model: string;
  year: number;
  vin?: string;         // 车架号
  licensePlate?: string; // 车牌
  engineNumber?: string; // 发动机号
  registrationDate?: string; // 注册时间
  color: string;
  currentMileage: number;
}

export interface ServiceRecord {
  id: string;
  vehicleId: string;
  date: string;
  type: ServiceType;
  description: string;
  cost: number;
  mileageAtService: number;
  notes?: string;
  photo?: string; // Base64 image string
}

export type RepairStatus = '待处理' | '维修中' | '已完成';
export type RepairUrgency = '一般' | '紧急' | '特急';

export interface RepairRequest {
  id: string;
  vehicleId: string;
  reporter: string; // 报修人
  description: string;
  urgency: RepairUrgency;
  status: RepairStatus;
  reportDate: string;
  photo?: string; // Base64
  resolvedDate?: string;
}

export interface ScrapItem {
  id: string;
  vehicleId: string;
  itemName: string; // 废品名称 (如: 旧电瓶, 废轮胎)
  photo?: string;
  entryDate: string; // 入库时间
  status: '库存' | '已处理';
  disposalDate?: string; // 变卖/处理时间
  saleAmount?: number; // 变卖金额
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export type ViewState = 'dashboard' | 'vehicles' | 'log' | 'report' | 'consultant' | 'recycle';