export async function wait(
  milliseconds: number,
  silent?: boolean
): Promise<number> {
  if (!!silent === false) console.log(`Waiting for ${milliseconds} ms`);

  await new Promise(res => setTimeout(() => res(), milliseconds));

  return milliseconds;
}
