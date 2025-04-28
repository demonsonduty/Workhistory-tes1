import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate the percentage difference between two numbers
export function calcPercentageDiff(actual: number, planned: number): number {
  if (planned === 0) return 0;
  return ((actual - planned) / planned) * 100;
}

// Determine if a job is efficient, on-target, or inefficient
export function getJobEfficiencyClass(actual: number, planned: number): string {
  const diff = calcPercentageDiff(actual, planned);
  
  if (diff <= -5) return "text-sulzer-success"; // Efficient (under by 5%+)
  if (diff <= 5) return "text-gray-700"; // On target (within 5%)
  if (diff <= 15) return "text-sulzer-warning"; // Slightly inefficient (5-15% over)
  return "text-sulzer-danger"; // Very inefficient (15%+ over)
}

// Get chart colors for each dataset
export function getChartColors(index: number): string {
  const colors = [
    '#0a3d62', // Sulzer Blue
    '#e74c3c', // Danger Red
    '#2ecc71', // Success Green
    '#f39c12', // Warning Orange
    '#9b59b6', // Purple
    '#3498db', // Light Blue
    '#95a5a6', // Gray
  ];
  
  return colors[index % colors.length];
}

// Format a date string to a readable format
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
