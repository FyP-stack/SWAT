export type AttackRecord = {
  attackId: number;
  startTime?: string;
  endTime?: string;
  rawTimeValue?: number;          // Provided numeric timestamp for reference
  relativeTime?: number;          // Provided relative time value if any
  stageSensors: string[];         // Sensors / actuators / pumps involved
  initialState: string;
  attackAction: string;
  intentMet: boolean;
  expectedImpact: string;
  unexpectedOutcome?: string;
  classification?: string;        // Derived
  stages?: string[];              // Derived
};

const STAGE_OVERRIDE: Record<string,string> = {
  // Add explicit mappings where heuristic might fail
  'MV-101': 'P1',
  'LIT-101': 'P1',
  'P-101': 'P1',
  'P-102': 'P1',
  'AIT-202': 'P2',
  'LIT-301': 'P3',
  'DPIT-301': 'P3',
  'FIT-401': 'P4',
  'LIT-401': 'P4',
  'UV-401': 'P4',
  'AIT-402': 'P4',
  'AIT-502': 'P5',
  'P-501': 'P5',
  'AIT-504': 'P5',
  'FIT-502': 'P5',
  'P-602': 'P6',
};

function inferStage(sensor: string): string {
  if (STAGE_OVERRIDE[sensor]) return STAGE_OVERRIDE[sensor];
  // Heuristic: Look for number after dash or inside name; map first digit of number cluster
  const match = sensor.match(/(\d{3})/);
  if (match) {
    const prefix = match[1][0]; // first digit of 3-digit code
    switch (prefix) {
      case '1': return 'P1';
      case '2': return 'P2';
      case '3': return 'P3';
      case '4': return 'P4';
      case '5': return 'P5';
      case '6': return 'P6';
      default: return 'PX';
    }
  }
  return 'PX';
}

function classifyAttack(ar: AttackRecord): string {
  const stages = Array.from(new Set(ar.stageSensors.map(inferStage)));
  const sensors = Array.from(new Set(ar.stageSensors));
  const stagesCount = stages.length;
  const sensorCount = sensors.length;

  if (stagesCount === 1) {
    return sensorCount === 1
      ? 'Single Stage Single Point'
      : 'Single Stage Multi Point';
  } else {
    return sensorCount === 1
      ? 'Multi Stage Single Point'
      : 'Multi Stage Multi Point';
  }
}

// Data assembled from your provided tables (first 41 attacks plus multi-sensor rows).
// You can continue to add more entries or refine start/end times.
const BASE_ATTACKS: AttackRecord[] = [
  {
    attackId: 1,
    rawTimeValue: 42366.45218,
    relativeTime: 0.457291667,
    stageSensors: ['MV-101'],
    initialState: 'MV-101 is closed',
    attackAction: 'Open MV-101',
    intentMet: true,
    expectedImpact: 'Tank overflow',
  },
  {
    attackId: 2,
    rawTimeValue: 42366.45218,
    relativeTime: 0.457291667,
    stageSensors: ['P-102','P-101'],
    initialState: 'P-101 on / P-102 off',
    attackAction: 'Turn on P-102',
    intentMet: true,
    expectedImpact: 'Pipe bursts',
  },
  {
    attackId: 3,
    rawTimeValue: 42366.47361,
    relativeTime: 0.478032407,
    stageSensors: ['LIT-101'],
    initialState: 'Water level between L and H',
    attackAction: 'Increase 1mm every second',
    intentMet: false,
    expectedImpact: 'Tank underflow; Damage P-101',
  },
  {
    attackId: 4,
    rawTimeValue: 42366.49142,
    relativeTime: 0.495925926,
    stageSensors: ['MV-504'],
    initialState: 'MV-504 closed',
    attackAction: 'Open MV-504',
    intentMet: true,
    expectedImpact: 'Halt RO shutdown sequence; Reduce RO life',
    unexpectedOutcome: 'No impact',
  },
  {
    attackId: 5,
    rawTimeValue: 42366.49884,
    stageSensors: [],
    initialState: 'No Physical Impact Attack',
    attackAction: '—',
    intentMet: false,
    expectedImpact: 'None',
  },
  {
    attackId: 6,
    rawTimeValue: 42366.50064,
    relativeTime: 0.502893519,
    stageSensors: ['AIT-202'],
    initialState: 'AIT-202 > 7.05',
    attackAction: 'Set AIT-202 to 6',
    intentMet: false,
    expectedImpact: 'P-203 turns off; Change in water quality',
    unexpectedOutcome: 'Impact on AIT-504 after 2h (above HH) but drainage did not start',
  },
  {
    attackId: 7,
    rawTimeValue: 42366.50584,
    relativeTime: 0.510798611,
    stageSensors: ['LIT-301'],
    initialState: 'LIT301 between L & H',
    attackAction: 'Increase level above HH',
    intentMet: false,
    expectedImpact: 'Stop inflow; Tank underflow; Damage P-301',
  },
  {
    attackId: 8,
    rawTimeValue: 42366.54873,
    relativeTime: 0.559872685,
    stageSensors: ['DPIT-301'],
    initialState: 'DPIT < 40kPa',
    attackAction: 'Set DPIT > 40kPa',
    intentMet: false,
    expectedImpact: 'Backwash restarts repeatedly; Normal operation stops',
    unexpectedOutcome: 'Decrease LIT401 level; Increase LIT301 level',
  },
  {
    attackId: 9,
    rawTimeValue: 42366.59375,
    stageSensors: [],
    initialState: 'No Physical Impact Attack',
    attackAction: '—',
    intentMet: false,
    expectedImpact: 'None',
  },
  {
    attackId: 10,
    rawTimeValue: 42366.59468,
    relativeTime: 0.596527778,
    stageSensors: ['FIT-401'],
    initialState: 'FIT-401 > 1',
    attackAction: 'Set FIT-401 < 0.7',
    intentMet: false,
    expectedImpact: 'UV shutdown; P-501 off',
    unexpectedOutcome: 'UV & P-501 did not turn off',
  },
  {
    attackId: 11,
    rawTimeValue: 42366.59653,
    relativeTime: 0.603009259,
    stageSensors: ['FIT-401'],
    initialState: 'FIT-401 > 1',
    attackAction: 'Set FIT-401 = 0',
    intentMet: false,
    expectedImpact: 'UV shutdown; P-501 off',
  },
  {
    attackId: 12,
    rawTimeValue: 42367.46574,
    stageSensors: [],
    initialState: 'No Physical Impact Attack',
    attackAction: '—',
    intentMet: false,
    expectedImpact: 'None',
  },
  {
    attackId: 13,
    rawTimeValue: 42367.46626,
    relativeTime: 0.468946759,
    stageSensors: ['MV-304'],
    initialState: 'MV-304 open',
    attackAction: 'Close MV-304',
    intentMet: true,
    expectedImpact: 'Halt stage 3 (backwash change)',
    unexpectedOutcome: 'Startup did not stop because MV-304 closed late',
  },
  {
    attackId: 14,
    rawTimeValue: 42367.48310,
    relativeTime: 0.488078704,
    stageSensors: ['MV-303'],
    initialState: 'MV-303 closed',
    attackAction: 'Prevent MV-303 opening',
    intentMet: true,
    expectedImpact: 'Halt stage 3 (backwash change)',
    unexpectedOutcome: 'Attack failed; Tank 301 already full; Startup not started',
  },
  {
    attackId: 15,
    rawTimeValue: 42367.49446,
    stageSensors: [],
    initialState: 'No Physical Impact Attack',
    attackAction: '—',
    intentMet: false,
    expectedImpact: 'None',
  },
  {
    attackId: 16,
    rawTimeValue: 42367.49821,
    relativeTime: 0.501388889,
    stageSensors: ['LIT-301'],
    initialState: 'Water level between L & H',
    attackAction: 'Decrease 1mm each second',
    intentMet: false,
    expectedImpact: 'Tank Overflow',
  },
  {
    attackId: 17,
    rawTimeValue: 42367.60986,
    relativeTime: 0.618148148,
    stageSensors: ['MV-303'],
    initialState: 'Closed',
    attackAction: 'Prevent MV-303 opening',
    intentMet: true,
    expectedImpact: 'Halt stage 3 (backwash change)',
  },
  {
    attackId: 18,
    rawTimeValue: 42367.75619,
    stageSensors: [],
    initialState: 'No Physical Impact Attack',
    attackAction: '—',
    intentMet: false,
    expectedImpact: 'None',
  },
  {
    attackId: 19,
    rawTimeValue: 42367.75744,
    relativeTime: 0.760428241,
    stageSensors: ['AIT-504'],
    initialState: 'AIT-504 < 15µS/cm',
    attackAction: 'Set AIT-504 to 16 µS/cm',
    intentMet: false,
    expectedImpact: 'RO shutdown sequence after 30 min; water to drain',
    unexpectedOutcome: 'RO did not shutdown; no drain',
  },
  {
    attackId: 20,
    rawTimeValue: 42367.76091,
    relativeTime: 0.765474537,
    stageSensors: ['AIT-504'],
    initialState: 'AIT-504 < 15µS/cm',
    attackAction: 'Set AIT-504 to 255 µS/cm',
    intentMet: false,
    expectedImpact: 'RO shutdown sequence after 30 min; water to drain',
    unexpectedOutcome: 'RO did not shutdown; no drain',
  },
  {
    attackId: 21,
    rawTimeValue: 42367.77083,
    relativeTime: 0.779166667,
    stageSensors: ['MV-101','LIT-101'],
    initialState: 'MV-101 open; LIT-101 between L & H',
    attackAction: 'Keep MV-101 on; LIT-101 set to 700mm',
    intentMet: true,
    expectedImpact: 'Tank overflow',
  },
  {
    attackId: 22,
    rawTimeValue: 42367.95507,
    relativeTime: 0.960416667,
    stageSensors: ['UV-401','AIT-502','P-501'],
    initialState: 'UV-401 on; AIT-502 <150; P-501 open',
    attackAction: 'Stop UV-401; Set AIT-502 150; Force P-501 on',
    intentMet: true,
    expectedImpact: 'Possible RO damage',
    unexpectedOutcome: 'P-501 could not stay on; Reduced FIT-502 output',
  },
  {
    attackId: 23,
    rawTimeValue: 42368.07123,
    relativeTime: 0.079282407,
    stageSensors: ['P-602','DPIT-301','MV-302'],
    initialState: 'DPIT-301 <0.4 bar; MV-302 on; P-602 closed',
    attackAction: 'DPIT >0.4 bar; Keep MV-302 open; Keep P-602 closed',
    intentMet: true,
    expectedImpact: 'System freeze',
  },
  {
    attackId: 24,
    rawTimeValue: 42368.41051,
    relativeTime: 0.414212963,
    stageSensors: ['P-203','P-205'],
    initialState: 'P-203 on; P-205 on',
    attackAction: 'Turn off P-203 & P-205',
    intentMet: true,
    expectedImpact: 'Change water quality',
    unexpectedOutcome: 'Limited impact due to P-101 closure as Tank 101 became full',
  },
  {
    attackId: 25,
    rawTimeValue: 42368.41794,
    relativeTime: 0.425011574,
    stageSensors: ['LIT-401','P-401'],
    initialState: 'LIT-401 <1000; P-402 on',
    attackAction: 'Set LIT-401=1000; Keep P-402 on',
    intentMet: true,
    expectedImpact: 'Tank underflow',
  },
  {
    attackId: 26,
    rawTimeValue: 42368.71176,
    relativeTime: 0.728472222,
    stageSensors: ['P-101','LIT-301'],
    initialState: 'P-101 off; P-102 on; LIT-301 between L & H',
    attackAction: 'Turn P-101 on continuously; Set LIT-301=801mm',
    intentMet: true,
    expectedImpact: 'Tank 101 underflow; Tank 301 overflow',
  },
  {
    attackId: 27,
    rawTimeValue: 42369.05356,
    relativeTime: 0.073125,
    stageSensors: ['P-302','LIT-401'],
    initialState: 'P-302 on; LIT-401 between L & H',
    attackAction: 'Keep P-302 on; LIT-401=600mm until 1:26:01',
    intentMet: true,
    expectedImpact: 'Tank overflow',
  },
  {
    attackId: 28,
    rawTimeValue: 42369.07314,
    relativeTime: 0.4690625,
    stageSensors: ['P-302'],
    initialState: 'P-302 on',
    attackAction: 'Close P-302',
    intentMet: true,
    expectedImpact: 'Stop inflow to T-401',
  },
  {
    attackId: 29,
    rawTimeValue: 42369.64722,
    relativeTime: 0.648611111,
    stageSensors: ['P-201','P-203','P-205'],
    initialState: 'All closed',
    attackAction: 'Turn on P-201,P-203,P-205',
    intentMet: true,
    expectedImpact: 'Wastage of chemicals',
    unexpectedOutcome: 'Dosing pumps did not start (mechanical interlock)',
  },
  {
    attackId: 30,
    rawTimeValue: 42369.65810,
    relativeTime: 0.671643519,
    stageSensors: ['LIT-101','P-101','MV-201'],
    initialState: 'P-101 off; MV-101 off; MV-201 off; LIT-101 & LIT-301 between L & H',
    attackAction: 'Turn P-101 on; MV-101 on; LIT-101=700mm; P-102 auto-started',
    intentMet: true,
    expectedImpact: 'Tank101 underflow; Tank301 overflow',
  },
  {
    attackId: 31,
    rawTimeValue: 42369.92053,
    relativeTime: 0.924768519,
    stageSensors: ['LIT-401'],
    initialState: 'Water level between L & H',
    attackAction: 'Set LIT-401 < L',
    intentMet: false,
    expectedImpact: 'Tank overflow',
  },
  {
    attackId: 32,
    rawTimeValue: 42370.44167,
    relativeTime: 0.448611111,
    stageSensors: ['LIT-301'],
    initialState: 'Water level between L & H',
    attackAction: 'Set LIT-301 above HH',
    intentMet: false,
    expectedImpact: 'Tank underflow; Damage P-302',
  },
  {
    attackId: 33,
    rawTimeValue: 42370.59806,
    relativeTime: 0.60318287,
    stageSensors: ['LIT-101'],
    initialState: 'Water level between L & H',
    attackAction: 'Set LIT-101 above H',
    intentMet: false,
    expectedImpact: 'Tank underflow; Damage P-101',
  },
  {
    attackId: 34,
    rawTimeValue: 42370.71713,
    relativeTime: 0.718287037,
    stageSensors: ['P-101'],
    initialState: 'P-101 on',
    attackAction: 'Turn P-101 off',
    intentMet: true,
    expectedImpact: 'Stops outflow',
    unexpectedOutcome: 'Outflow persisted (system turned on P-102)',
  },
  {
    attackId: 35,
    rawTimeValue: 42370.72148,
    relativeTime: 0.727037037,
    stageSensors: ['P-101','P-102'],
    initialState: 'P-101 on; P-102 off',
    attackAction: 'Turn P-101 off; Keep P-102 off',
    intentMet: true,
    expectedImpact: 'Stops outflow',
  },
  {
    attackId: 36,
    rawTimeValue: 42370.92779,
    relativeTime: 0.934027778,
    stageSensors: ['LIT-101'],
    initialState: 'Water level between L & H',
    attackAction: 'Set LIT-101 less than LL',
    intentMet: false,
    expectedImpact: 'Tank overflow',
  },
  {
    attackId: 37,
    rawTimeValue: 42006.47016,
    relativeTime: 0.475578704,
    stageSensors: ['P-501','FIT-502'],
    initialState: 'P-501 on; FIT-502 normal',
    attackAction: 'Close P-501; FIT-502 -> 1.29',
    intentMet: false,
    expectedImpact: 'Reduced output',
    unexpectedOutcome: 'P-501 did not turn off; FIT-502 decreased to 0.8; speed increased to 28.5Hz',
  },
  {
    attackId: 38,
    rawTimeValue: 42006.48030,
    relativeTime: 0.483541667,
    stageSensors: ['AIT-402','AIT-502'],
    initialState: 'In normal range',
    attackAction: 'AIT402=260; AIT502=260',
    intentMet: false,
    expectedImpact: 'Water goes to drain (overdosing)',
    unexpectedOutcome: 'Water did not go to drain',
  },
  {
    attackId: 39,
    rawTimeValue: 42006.48875,
    relativeTime: 0.49337963,
    stageSensors: ['FIT-401','AIT-502'],
    initialState: 'In normal range',
    attackAction: 'FIT-401=0.5; AIT-502=140mV',
    intentMet: false,
    expectedImpact: 'UV shutdown; water to RO',
    unexpectedOutcome: 'UV did not shutdown',
  },
  {
    attackId: 40,
    rawTimeValue: 42006.49424,
    relativeTime: 0.497662037,
    stageSensors: ['FIT-401'],
    initialState: 'In normal range',
    attackAction: 'FIT-401=0',
    intentMet: false,
    expectedImpact: 'UV shutdown; water to RO',
    unexpectedOutcome: 'P-402 did not close (interlink failed)',
  },
  {
    attackId: 41,
    rawTimeValue: 42006.55072,
    relativeTime: 0.570092593,
    stageSensors: ['LIT-301'],
    initialState: 'Water level between L & H',
    attackAction: 'Decrease value 0.5mm/s',
    intentMet: false,
    expectedImpact: 'Tank overflow',
    unexpectedOutcome: 'Rate decreased after 1:33:25 PM',
  },
];

// Derive classification & stages
export const ATTACKS: AttackRecord[] = BASE_ATTACKS.map(a => {
  const stages = Array.from(new Set(a.stageSensors.map(inferStage)));
  return {
    ...a,
    stages,
    classification: classifyAttack(a),
  };
});

export const CLASSIFICATIONS = [
  'Single Stage Single Point',
  'Single Stage Multi Point',
  'Multi Stage Single Point',
  'Multi Stage Multi Point',
];

export const STAGES = ['P1','P2','P3','P4','P5','P6'];