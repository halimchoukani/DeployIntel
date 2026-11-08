import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  triggerSemgrepGateCheck,
  triggerK6PerformanceCheck,
  getProjectTestHistory,
  GateCheckResponse,
  K6CheckResponse,
  TestRunHistoryItem,
} from "@/lib/api/gate";

export function useGateCheck(projectId: string) {
  const [data, setData] = useState<GateCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const runCheck = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await triggerSemgrepGateCheck(projectId);
      setData(response);
      return response;
    } catch (err: any) {
      const wrappedError = err instanceof Error ? err : new Error(String(err));
      setError(wrappedError);
      throw wrappedError;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    runCheck,
    reset,
  };
}

export function useK6GateCheck(projectId: string) {
  const [data, setData] = useState<K6CheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const runCheck = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await triggerK6PerformanceCheck(projectId);
      setData(response);
      return response;
    } catch (err: any) {
      const wrappedError = err instanceof Error ? err : new Error(String(err));
      setError(wrappedError);
      throw wrappedError;
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    data,
    isLoading,
    error,
    runCheck,
    reset,
  };
}

export function useTestHistory(projectId: string) {
  return useQuery<TestRunHistoryItem[]>({
    queryKey: ["test-history", projectId],
    queryFn: () => getProjectTestHistory(projectId),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const runs = query.state.data;
      const isRunning = runs?.some(r => r.status === "RUNNING" || r.status === "PENDING");
      return isRunning ? 3000 : false;
    },
    staleTime: 10 * 1000,
  });
}

