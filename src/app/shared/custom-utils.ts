/**
 * simple function to implement async setTimeout
 *
 * @param ms
 * @returns
 */
export async function _timeout(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
