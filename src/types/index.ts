export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: '男' | '女';
}

export interface TreatmentItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface VisitRecord {
  id: string;
  patientId: string;
  patientName: string;
  visitDate: string;
  visitTime: string;
  registration: {
    completed: boolean;
    operator?: string;
    time?: string;
  };
  payment: {
    completed: boolean;
    amount?: number;
    operator?: string;
    time?: string;
  };
  treatment: {
    completed: boolean;
    items: TreatmentItem[];
    doctor?: string;
    nurse?: string;
    startTime?: string;
    endTime?: string;
  };
  nextAppointment: {
    completed: boolean;
    date?: string;
    time?: string;
    content?: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'abnormal';
}

export interface NursingItem {
  id: string;
  name: string;
  category: '消毒追溯' | '器械包' | '术后告知' | '影像归档';
}

export interface NursingAuditRecord {
  id: string;
  visitId: string;
  patientName: string;
  auditDate: string;
  auditor: string;
  items: {
    itemId: string;
    itemName: string;
    passed: boolean;
    reason?: string;
    remedyPerson?: string;
    remedied: boolean;
    remedyTime?: string;
  }[];
  status: '待整改' | '整改中' | '已完成';
}

export interface HandoverItem {
  id: string;
  type: '未补签' | '未回收同意书' | '未上传影像' | '其他';
  content: string;
  patientName: string;
  visitId: string;
  fromShift: '白班' | '晚班';
  createTime: string;
  creator: string;
  handled: boolean;
  handleTime?: string;
  handler?: string;
  remark?: string;
}

export interface HandoverRecord {
  id: string;
  date: string;
  fromShift: '白班' | '晚班';
  toShift: '白班' | '晚班';
  items: HandoverItem[];
  createTime: string;
  creator: string;
}
