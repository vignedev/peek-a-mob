// taken from InaSavesALot, adapted with generics
export function lowerBound<T>(array: T[], lessthan: (val: T) => boolean): number {
  let low = 0
  let high = array.length

  while (low < high) {
    const mid = Math.floor((low + high) / 2)

    if (lessthan(array[mid])) { // array[mid] < value
      low = mid + 1
    } else {
      high = mid
    }
  }

  return low
}