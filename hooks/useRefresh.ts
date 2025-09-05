import { useCallback, useEffect, useMemo, useState } from 'react';

type FetchFn = () => Promise<unknown>;

const useRefresh = (query: FetchFn, key?: (string | number | null | undefined)[]) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    query().finally(() => setRefreshing(false));
  }, [query]);

  const keySignature = useMemo(() => (key ? key.join('|') : ''), [key]);

  useEffect(() => {
    setRefreshing(false);
  }, [keySignature]);

  return { refreshing, onRefresh };
};

export default useRefresh;
