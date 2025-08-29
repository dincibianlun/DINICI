export function getEnvironmentVariable(key: string): string | undefined {
  return import.meta.env[key];
}

export function getSafeEnvironmentVariable(key: string): string {
  const value = getEnvironmentVariable(key);
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
}