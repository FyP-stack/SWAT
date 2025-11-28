export type SensorDef = {
  id: string;
  name: string;
  unit?: string;
  range?: string;
  process: 'P1'|'P2'|'P3'|'P4'|'P5'|'P6';
  status?: 'ok'|'warn'|'err';
  desc?: string;
};

export const PROCESSES: Array<SensorDef['process']> = ['P1','P2','P3','P4','P5','P6'];

export const sensorsByProcess: Record<string, SensorDef[]> = {
  P1: [
    { id: 'LIT101', name: 'Raw Water Tank Level', unit: '%', range: '0–100', process: 'P1', status: 'ok', desc: 'Measures level in raw water tank.' },
    { id: 'P101', name: 'Raw Water Pump', process: 'P1', status: 'ok', desc: 'Feeds raw water to P2.' },
  ],
  P2: [
    { id: 'FIT201', name: 'Flow Indicator', unit: 'm³/h', process: 'P2', status: 'ok' },
    { id: 'AIT201', name: 'pH/Conductivity Analyzer', process: 'P2', status: 'ok' },
    { id: 'P201', name: 'Acid Dosing Pump', process: 'P2', status: 'warn' },
    { id: 'P203', name: 'NaOCl Dosing Pump', process: 'P2', status: 'ok' },
    { id: 'P205', name: 'NaCl Dosing Pump', process: 'P2', status: 'ok' },
  ],
  P3: [
    { id: 'LIT301', name: 'UF Feed Tank Level', unit: '%', process: 'P3', status: 'ok' },
    { id: 'P301', name: 'UF Feed Pump', process: 'P3', status: 'ok' },
    { id: 'DPIT301', name: 'UF Differential Pressure', unit: 'bar', process: 'P3', status: 'ok' },
  ],
  P4: [
    { id: 'LIT401', name: 'RO Feed Tank Level', unit: '%', process: 'P4', status: 'ok' },
    { id: 'P401', name: 'RO Feed Pump', process: 'P4', status: 'ok' },
    { id: 'AIT402', name: 'UV Dechlorinator', process: 'P4', status: 'ok' },
  ],
  P5: [
    { id: 'AIT503', name: 'Cartridge Filter Analyzer', process: 'P5', status: 'ok' },
    { id: 'P501', name: 'RO Boost Pump', process: 'P5', status: 'ok' },
    { id: 'AIT504', name: 'RO Unit Analyzer', process: 'P5', status: 'ok' },
  ],
  P6: [
    { id: 'PERM', name: 'Permeate Flow', unit: 'm³/h', process: 'P6', status: 'ok', desc: 'Permeate production to storage.' },
  ],
};