import {
  DefaultError,
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export function useInfiniteQueryWithFocus<
  TQueryFnData = unknown,
  TError = DefaultError,
  TPageParam = unknown,
  TData = InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam> & {
    /** 是否在页面 focus 时自动刷新 */
    refetchOnScreenFocus?: boolean;
  },
): UseInfiniteQueryResult<NoInfer<TData>, TError> {
  const query = useInfiniteQuery(options);
  const refetch = query.refetch;

  useFocusEffect(
    useCallback(() => {
      if (options.refetchOnScreenFocus ?? true) {
        refetch();
      }
    }, [refetch, options.refetchOnScreenFocus]),
  );

  return query;
}
