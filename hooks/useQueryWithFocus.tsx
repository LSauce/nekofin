import {
  DefaultError,
  QueryKey,
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useQueryWithFocus<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> & {
    /** 是否在页面 focus 时自动刷新 */
    refetchOnScreenFocus?: boolean;
  },
): UseQueryResult<NoInfer<TData>, TError> {
  const query = useQuery(options);
  const refetch = query.refetch;

  useFocusEffect(
    useCallback(() => {
      if (options.refetchOnScreenFocus) {
        refetch();
      }
    }, [refetch, options.refetchOnScreenFocus]),
  );

  return query;
}
