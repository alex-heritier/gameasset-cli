export function sanitizeFilename(
  filename: string,
  maxLength: number = 100
): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[^\w\-.]/g, '')
    .slice(0, maxLength);
}
