import { useState, useCallback } from "react";
import {
  triggerSemgrepGateCheck,
  triggerK6PerformanceCheck,
  GateCheckResponse,
  K6CheckResponse,
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
