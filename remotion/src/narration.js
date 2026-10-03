export function voiceMetadata(value) {
  if (!value || ['text', 'speechText'].some((key) => typeof value[key] !== 'string' || !value[key].trim()) ||
      !Number.isInteger(value.speakerId) || value.speakerId < 0 ||
      (value.speedScale !== null && (!Number.isFinite(value.speedScale) || value.speedScale < 0.5 || value.speedScale > 2)) ||
      !Number.isFinite(value.duration_seconds) || value.duration_seconds <= 0 ||
      !/^[a-f0-9]{64}$/.test(value.sha256 ?? '')) {
    throw new Error('Invalid voice metadata; use the JSON output from indie_narration synthesize');
  }
  return {narrationText: value.text, speechText: value.speechText, speakerId: value.speakerId,
    speedScale: value.speedScale, sha256: value.sha256};
}
