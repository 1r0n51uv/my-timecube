import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getMyTimecubeAPI,
} from "@/api/generated/client";
import { queryClient } from "@/api/query-client";
import { queryKeys } from "@/api/keys";
import type { TimeEntry } from "@/lib/types";

const api = getMyTimecubeAPI();

export function useAppConfigQuery() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: () => api.getAppConfig(),
  });
}

export function useActivitiesQuery(username: string | null) {
  return useQuery({
    queryKey: username ? queryKeys.activities(username) : ["activities", "anonymous"],
    queryFn: () => api.getUserActivities(username as string),
    enabled: Boolean(username),
  });
}

export function useUpdateActivitiesMutation(username: string) {
  return useMutation({
    mutationFn: (activities: string[]) =>
      api.updateUserActivities(username, {
        activities,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.activities(username), data);
    },
  });
}

export function useEntriesQuery(username: string | null, year: number, month: number) {
  return useQuery({
    queryKey: username ? queryKeys.entries(username, year, month) : ["entries", "anonymous", year, month],
    queryFn: () => api.getUserTimeEntries(username as string, { year, month }),
    enabled: Boolean(username),
  });
}

export function useReplaceEntriesMutation(username: string, year: number, month: number) {
  return useMutation({
    mutationFn: (entries: TimeEntry[]) =>
      api.replaceUserTimeEntries(username, { entries }, { year, month }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.entries(username, year, month), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.monthlySummary(year, month) });
    },
  });
}

export function useMonthlySummaryQuery(year: number, month: number, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.monthlySummary(year, month),
    queryFn: () => api.getMonthlySummary({ year, month }),
    enabled,
  });
}
