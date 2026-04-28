export async function processInChunks<T>(items: T[], chunkSize: number, handler: (chunk: T[], index: number) => Promise<void>) {
  if (!items.length) return;
  const safeChunkSize = Math.max(1, Math.floor(chunkSize) || 1);
  for (let index = 0; index < items.length; index += safeChunkSize) {
    await handler(items.slice(index, index + safeChunkSize), index / safeChunkSize);
  }
}
