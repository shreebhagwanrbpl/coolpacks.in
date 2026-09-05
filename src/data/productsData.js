export const makeSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");

export const fallbackProducts = [
  {
    id: "prod-1",
    title: "Fully Automated Clinical Chemistry Analyzer",
    slug: "fully-automated-clinical-chemistry-analyzer",
    category: "Diagnostic Analyzers",
    description: "High-throughput clinical chemistry analyzer engineered for accurate enzymatic, colorimetric, and immunoassay diagnostic tests in modern laboratories.",
    features: ["Up to 400 tests/hour", "Auto-dilution & STAT capability", "Low reagent consumption", "LIS/HIS Integration ready"],
    specs: {
      "Throughput": "400 tests per hour",
      "Wavelength": "340nm - 800nm",
      "Sample Tray": "80 positions",
      "Reagent Cooling": "2°C - 8°C continuous"
    },
    badge: "Best Seller",
    status: "In Stock",
    image: ""
  },
  {
    id: "prod-2",
    title: "5-Part Differential Hematology Analyzer",
    slug: "5-part-differential-hematology-analyzer",
    category: "Diagnostic Analyzers",
    description: "Advanced laser scatter hematology system providing 29 diagnostic parameters with high precision for clinical laboratories and hospitals.",
    features: ["29 parameters + 3 histograms", "Laser scatter + Cytometry", "Micro-sample volume (20µL)", "Touchscreen interface"],
    specs: {
      "Parameters": "29 reportable parameters",
      "Sample Volume": "20 µL whole blood",
      "Throughput": "60 samples/hour",
      "Display": "10.4 inch HD touch screen"
    },
    badge: "ISO Certified",
    status: "In Stock",
    image: ""
  },
  {
    id: "prod-3",
    title: "Real-Time PCR Fluorescence Quantitative System",
    slug: "real-time-pcr-fluorescence-quantitative-system",
    category: "Molecular Diagnostics",
    description: "Ultra-sensitive 96-well real-time PCR instrument designed for DNA/RNA pathogen detection, viral load monitoring, and genetic analysis.",
    features: ["96-well fast thermal block", "4 to 6 optical channels", "High thermal uniformity", "Automated analysis software"],
    specs: {
      "Block Format": "96 wells (0.2ml)",
      "Excitation": "High power LED",
      "Ramp Rate": "Up to 6.1°C/sec",
      "Sensitivity": "Single copy detection"
    },
    badge: "Advanced Tech",
    status: "In Stock",
    image: ""
  },
  {
    id: "prod-4",
    title: "Multi-Parameter Patient Monitor (12.1-Inch)",
    slug: "multi-parameter-patient-monitor-121-inch",
    category: "Hospital & ICU Gear",
    description: "Comprehensive patient monitor tracking ECG, SpO2, NIBP, Respiration, and Temperature with intuitive alarm management for ICU/OT settings.",
    features: ["12.1-inch color TFT LCD", "7-lead ECG waveform display", "Arrhythmia & ST segment analysis", "Li-ion battery backup (4h)"],
    specs: {
      "Screen": "12.1 inch color TFT",
      "Parameters": "ECG, SpO2, NIBP, Resp, Temp",
      "Battery": "Rechargeable Lithium 4000mAh",
      "Networking": "Central station connectable"
    },
    badge: "ICU Standard",
    status: "In Stock",
    image: ""
  },
  {
    id: "prod-5",
    title: "Automated Electrolyte Analyzer (Na/K/Cl/Ca/pH)",
    slug: "automated-electrolyte-analyzer-nakclcaph",
    category: "Diagnostic Analyzers",
    description: "Ion-selective electrode (ISE) electrolyte analyzer providing rapid, precise blood gas and electrolyte measurements in emergency care.",
    features: ["Maintenance-free electrodes", "Auto-calibration cycle", "Fast test time (<30 seconds)", "Integrated thermal printer"],
    specs: {
      "Sample Type": "Serum, Plasma, Whole Blood",
      "Test Speed": "60 tests per hour",
      "Data Storage": "10,000 patient records",
      "Interface": "RS232 / USB port"
    },
    badge: "Rapid Test",
    status: "In Stock",
    image: ""
  },
  {
    id: "prod-6",
    title: "Binocular Biological LED Microscope 1000x",
    slug: "binocular-biological-led-microscope-1000x",
    category: "Laboratory Equipment",
    description: "Ergonomic research-grade optical microscope with plan achromatic objectives, bright LED illumination, and coaxially aligned focusing controls.",
    features: ["Plan Achromatic 4x/10x/40x/100x", "Variable intensity 3W LED", "Abbe condenser N.A. 1.25", "Double layer mechanical stage"],
    specs: {
      "Head": "Binocular 30° inclined, 360° rotating",
      "Magnification": "40x to 1000x",
      "Eyepieces": "WF10x/20mm widefield",
      "Stage Size": "140mm x 140mm"
    },
    badge: "Precision Optics",
    status: "In Stock",
    image: ""
  },
  {
    id: "prod-7",
    title: "High-Speed Refrigerated Centrifuge (18,000 RPM)",
    slug: "high-speed-refrigerated-centrifuge-18000-rpm",
    category: "Laboratory Equipment",
    description: "Versatile benchtop refrigerated centrifuge equipped with brushless motor, digital temperature control, and multiple rotor options for sample preparation.",
    features: ["Temperature range: -20°C to +40°C", "Brushless frequency motor", "Automatic rotor identification", "10 acceleration & braking curves"],
    specs: {
      "Max Speed": "18,000 RPM",
      "Max RCF": "23,900 x g",
      "Capacity": "4 x 250ml / 24 x 1.5ml",
      "Temp Accuracy": "±1.0°C"
    },
    badge: "High Power",
    status: "In Stock",
    image: ""
  },
  {
    id: "prod-8",
    title: "Diagnostic Clinical Reagent Kits & Controls",
    slug: "diagnostic-clinical-reagent-kits-controls",
    category: "Reagents & Consumables",
    description: "CE-marked high stability liquid reagents for biochemistry, immunoturbidimetry, and specialty enzyme assays with extended calibration shelf life.",
    features: ["Liquid stable ready-to-use", "High linearity & accuracy", "Broad analyzer compatibility", "Traceable control serum"],
    specs: {
      "Pack Types": "Dedicated & Universal vials",
      "Storage": "2°C to 8°C",
      "Shelf Life": "18 - 24 months",
      "Certification": "ISO 13485 / CE"
    },
    badge: "CE Certified",
    status: "In Stock",
    image: ""
  }
];

export const productCategories = [
  "All Categories",
  "Diagnostic Analyzers",
  "Molecular Diagnostics",
  "Hospital & ICU Gear",
  "Laboratory Equipment",
  "Reagents & Consumables"
];
