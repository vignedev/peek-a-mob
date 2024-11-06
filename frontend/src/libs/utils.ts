
/**
 * Performs the C++'s version of lower_bound. Assumes the array is sorted.-
 * @param array Sorted array tofind the lower bound in
 * @param isLess Function that performs 'a < value'
 * @returns Closest lower bound of the selected value
 */
export function lowerBound<T>(array: T[], isLess: (a: T) => boolean): number {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);

    if (isLess(array[mid])) { // array[mid] < value
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}