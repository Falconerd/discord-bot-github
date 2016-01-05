/**
 * Simple helper function to check if a thing is in an array.
 * @param  {Array} array The array to check.
 * @param  {any} thing The thing to check for.
 * @return {Boolean}       True if the thing is in the array, false otherwise.
 */
export default function(array, thing) {
  for (let el of array) {
    if (el === thing) {
      return true;
    }
  }
  return false;
}
