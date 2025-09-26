export function buildDeckFiltersPath(pathname: string, params: URLSearchParams) {
  const queryString = params.toString();

  if (!queryString) {
    return pathname;
  }

  return `${pathname}?${queryString}`;
}
