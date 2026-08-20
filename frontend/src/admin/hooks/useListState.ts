import { useState } from 'react'

/** Shared page/sort/dir state for admin list screens (pagination + sortable columns per API_CONTRACT.md). */
export function useListState(defaultSort: string) {
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState(defaultSort)
  const [dir, setDir] = useState<'asc' | 'desc'>('asc')

  function toggleSort(key: string) {
    if (sort === key) {
      setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(key)
      setDir('asc')
    }
    setPage(1)
  }

  return { page, setPage, sort, dir, toggleSort }
}
