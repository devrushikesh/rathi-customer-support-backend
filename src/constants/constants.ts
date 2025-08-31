enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
  URGENT = "URGENT",
}

enum Category {
  HARDWARE_ISSUE = "HARDWARE_ISSUE",
  SOFTWARE_ISSUE = "SOFTWARE_ISSUE",
  QUALITY_ISSUE = "QUALITY_ISSUE",
  MAINTENANCE = "MAINTENANCE",
  INSTALLATION = "INSTALLATION",
  TRAINING = "TRAINING",
  WARRANTY_CLAIM = "WARRANTY_CLAIM",
  SERVICING = "SERVICING",
  NETWORK_ISSUE = "NETWORK_ISSUE",
  ELECTRICAL_ISSUE = "ELECTRICAL_ISSUE",
  OTHER = "OTHER",
}

// Map enum names to actual enums
const Enums = {
  Priority,
  Category,
};

// Generic function
function isValidEnumValue(enumName: keyof typeof Enums, value: string): boolean {
  const enumObj = Enums[enumName];
  return Object.values(enumObj).includes(value);
}

export default isValidEnumValue