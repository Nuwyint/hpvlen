// Attempt sound first. Browsers may allow only muted autoplay, or require a tap.
export async function startUnlockedPlayback(video, isCurrent = () => true) {
  if (!isCurrent()) return 'stopped';
  video.muted = false;
  try {
    await video.play();
    if (!isCurrent()) {video.pause();return 'stopped';}
    return 'sound';
  } catch {
    if (!isCurrent()) return 'stopped';
  }
  video.muted = true;
  try {
    await video.play();
    if (!isCurrent()) {video.pause();return 'stopped';}
    return 'muted';
  } catch {
    return isCurrent() ? 'manual' : 'stopped';
  }
}
