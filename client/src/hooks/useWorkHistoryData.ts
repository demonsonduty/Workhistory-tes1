import { useQuery } from '@tanstack/react-query';
import { WorkHistorySummary, QuarterlySummary, YearlySummary } from '../types/workHistory';
import { FullSummaryData } from '../types/summaryData';

export function useWorkHistorySummary() {
  return useQuery<FullSummaryData>({
    queryKey: ['/api/workhistory/summary/full'],
    retry: 3,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true
  });
}

export function useQuarterlyTrends() {
  return useQuery<QuarterlySummary[]>({
    queryKey: ['/api/workhistory/trends/quarterly'],
    retry: 3,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true
  });
}

export function useYearlyData() {
  return useQuery<YearlySummary[]>({
    queryKey: ['/api/workhistory/summary/yearly'],
    retry: 3,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true
  });
}

export function useYearData(year: string) {
  return useQuery({
    queryKey: [`/api/workhistory/summary/year/${year}`],
    enabled: !!year && year !== 'all',
    retry: 3,
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: true
  });
}
