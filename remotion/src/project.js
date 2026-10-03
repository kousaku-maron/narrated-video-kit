import {validatePriceLabel} from './pricing.js';

export const framesFor = (seconds, fps) => Math.max(1, Math.ceil(seconds * fps));

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const validAssetPath = (value) =>
  typeof value === 'string' &&
  value.length > 0 &&
  !value.startsWith('/') &&
  !value.includes('\\') &&
  value.split('/').every((part) => part !== '' && part !== '.' && part !== '..');

export function sceneSeconds(scene, project) {
  if (scene.durationSeconds !== undefined && (!Number.isFinite(scene.durationSeconds) || scene.durationSeconds <= 0)) {
    throw new Error(`Scene ${scene.id}: durationSeconds must be positive`);
  }
  if (scene.padAfterSeconds !== undefined && (!Number.isFinite(scene.padAfterSeconds) || scene.padAfterSeconds < 0)) {
    throw new Error(`Scene ${scene.id}: padAfterSeconds must be nonnegative`);
  }
  if (scene.durationSeconds !== undefined) {
    return scene.durationSeconds;
  }
  const narration = scene.narration && project.assets[scene.narration.asset];
  if (narration && Number.isFinite(narration.durationSeconds) && narration.durationSeconds > 0) {
    return narration.durationSeconds + (scene.padAfterSeconds ?? 0.4);
  }
  throw new Error(`Scene ${scene.id}: set durationSeconds or add a WAV narration asset with a known duration`);
}

export function validateProject(project) {
  if (!isObject(project) || project.version !== 1) throw new Error('Project version must be 1');
  if (typeof project.title !== 'string' || !project.title.trim()) throw new Error('Project title is required');
  if (!Number.isInteger(project.fps) || project.fps < 1 || project.fps > 60) throw new Error('fps must be 1–60');
  if (!Number.isInteger(project.width) || project.width < 16) throw new Error('width must be at least 16');
  if (!Number.isInteger(project.height) || project.height < 16) throw new Error('height must be at least 16');
  if (!isObject(project.assets)) throw new Error('assets must be an object');
  if (!Array.isArray(project.scenes)) throw new Error('scenes must be an array');
  if (project.persona !== undefined && !/^[a-z0-9][a-z0-9-]{0,49}$/.test(project.persona)) {
    throw new Error('persona must be a pelsona/ folder name');
  }
  if (project.previewStaticAvatar !== undefined && typeof project.previewStaticAvatar !== 'boolean') {
    throw new Error('previewStaticAvatar must be a boolean');
  }

  for (const [id, asset] of Object.entries(project.assets)) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`Invalid asset ID: ${id}`);
    if (!isObject(asset) || !['image', 'video', 'audio'].includes(asset.kind)) throw new Error(`Asset ${id}: invalid kind`);
    if (!validAssetPath(asset.src)) throw new Error(`Asset ${id}: src must be a relative path under public/`);
    if (asset.mouthFrames !== undefined && (asset.kind !== 'audio' || typeof asset.mouthFrames !== 'string' || !/^[cho]+$/.test(asset.mouthFrames) || !Number.isFinite(asset.mouthFps) || asset.mouthFps <= 0)) {
      throw new Error(`Asset ${id}: mouthFrames require audio and a positive mouthFps`);
    }
  }

  if (project.soundtrack !== undefined) {
    const soundtrack = project.soundtrack;
    if (!isObject(soundtrack) || project.assets[soundtrack.asset]?.kind !== 'audio') {
      throw new Error('soundtrack.asset must reference audio');
    }
    if (soundtrack.volume !== undefined && (!Number.isFinite(soundtrack.volume) || soundtrack.volume < 0 || soundtrack.volume > 1)) {
      throw new Error('soundtrack.volume must be 0–1');
    }
    if (soundtrack.muteDuringTransitions !== undefined && typeof soundtrack.muteDuringTransitions !== 'boolean') {
      throw new Error('soundtrack.muteDuringTransitions must be boolean');
    }
    for (const key of ['fadeInSeconds', 'fadeOutSeconds']) {
      if (soundtrack[key] !== undefined && (!Number.isFinite(soundtrack[key]) || soundtrack[key] < 0)) {
        throw new Error(`soundtrack.${key} must be nonnegative`);
      }
    }
    if (soundtrack.endAtSeconds !== undefined && (!Number.isFinite(soundtrack.endAtSeconds) || soundtrack.endAtSeconds <= 0)) {
      throw new Error('soundtrack.endAtSeconds must be positive');
    }
  }
  if (project.endingSoundtrack !== undefined) {
    const ending = project.endingSoundtrack;
    if (!isObject(ending) || project.assets[ending.asset]?.kind !== 'audio') {
      throw new Error('endingSoundtrack.asset must reference audio');
    }
    if (typeof ending.startSceneId !== 'string' || !project.scenes.some((scene) => scene.id === ending.startSceneId)) {
      throw new Error('endingSoundtrack.startSceneId must reference a scene');
    }
    if (ending.volume !== undefined && (!Number.isFinite(ending.volume) || ending.volume < 0 || ending.volume > 1)) {
      throw new Error('endingSoundtrack.volume must be 0–1');
    }
    for (const key of ['fadeInSeconds', 'fadeOutSeconds']) {
      if (ending[key] !== undefined && (!Number.isFinite(ending[key]) || ending[key] < 0)) {
        throw new Error(`endingSoundtrack.${key} must be nonnegative`);
      }
    }
  }

  if (project.backgroundPlaylist !== undefined) {
    if (!Array.isArray(project.backgroundPlaylist) || project.backgroundPlaylist.length === 0) {
      throw new Error('backgroundPlaylist must contain video clips');
    }
    for (const clip of project.backgroundPlaylist) {
      if (!isObject(clip) || project.assets[clip.asset]?.kind !== 'video' || !Number.isFinite(clip.durationSeconds) || clip.durationSeconds <= 0) {
        throw new Error('Each backgroundPlaylist clip needs a video asset and positive durationSeconds');
      }
      if (clip.trimStartSeconds !== undefined && (!Number.isFinite(clip.trimStartSeconds) || clip.trimStartSeconds < 0)) {
        throw new Error('backgroundPlaylist trimStartSeconds must be nonnegative');
      }
    }
  }
  if (project.backgroundPlaylistEndAtSeconds !== undefined &&
      (!Number.isFinite(project.backgroundPlaylistEndAtSeconds) || project.backgroundPlaylistEndAtSeconds <= 0)) {
    throw new Error('backgroundPlaylistEndAtSeconds must be positive');
  }

  if (project.chapterIntro !== undefined && (
    !isObject(project.chapterIntro) ||
    !Number.isFinite(project.chapterIntro.durationSeconds) ||
    project.chapterIntro.durationSeconds <= 0
  )) {
    throw new Error('chapterIntro.durationSeconds must be positive');
  }
  if (project.chapterTransition !== undefined) {
    if (!isObject(project.chapterTransition) ||
        !Number.isFinite(project.chapterTransition.durationSeconds) ||
        project.chapterTransition.durationSeconds <= 0 ||
        project.chapterTransition.durationSeconds > 4) {
      throw new Error('chapterTransition.durationSeconds must be greater than 0 and at most 4');
    }
    if (project.chapterTransition.minorDurationSeconds !== undefined && (
        !Number.isFinite(project.chapterTransition.minorDurationSeconds) ||
        project.chapterTransition.minorDurationSeconds <= 0 ||
        project.chapterTransition.minorDurationSeconds > 1)) {
      throw new Error('chapterTransition.minorDurationSeconds must be greater than 0 and at most 1');
    }
    if (project.chapterTransition.cardOpacity !== undefined && (
        !Number.isFinite(project.chapterTransition.cardOpacity) ||
        project.chapterTransition.cardOpacity < 0 ||
        project.chapterTransition.cardOpacity > 1)) {
      throw new Error('chapterTransition.cardOpacity must be between 0 and 1');
    }
    if (project.chapterPlacement !== 'top-left-fixed') {
      throw new Error('chapterTransition requires top-left-fixed placement');
    }
  }

  const ids = new Set();
  for (const scene of project.scenes) {
    if (!isObject(scene) || typeof scene.id !== 'string' || !scene.id) throw new Error('Each scene needs an id');
    if (ids.has(scene.id)) throw new Error(`Duplicate scene ID: ${scene.id}`);
    ids.add(scene.id);
    if (scene.avatar !== undefined && typeof scene.avatar !== 'boolean') throw new Error(`Scene ${scene.id}: avatar must be a boolean`);
    if (scene.rawBackground !== undefined && typeof scene.rawBackground !== 'boolean') throw new Error(`Scene ${scene.id}: rawBackground must be a boolean`);
    if (scene.avatar && !project.persona) throw new Error(`Scene ${scene.id}: avatar requires project.persona`);
    if (scene.chapterLabel !== undefined && (typeof scene.chapterLabel !== 'string' || !scene.chapterLabel.trim())) {
      throw new Error(`Scene ${scene.id}: chapterLabel must be nonempty text`);
    }
    if (scene.chapterStart !== undefined && typeof scene.chapterStart !== 'boolean') {
      throw new Error(`Scene ${scene.id}: chapterStart must be a boolean`);
    }
    if (project.chapterTransition && scene.chapterStart) {
      if (scene.narration?.asset) {
        throw new Error(`Scene ${scene.id}: chapter transition scene must not contain narration`);
      }
      if (framesFor(sceneSeconds(scene, project), project.fps) < framesFor(project.chapterTransition.durationSeconds, project.fps)) {
        throw new Error(`Scene ${scene.id}: chapter transition scene is shorter than chapterTransition.durationSeconds`);
      }
    }
    if (scene.endCard !== undefined && (
      !isObject(scene.endCard) ||
      typeof scene.endCard.headline !== 'string' || !scene.endCard.headline.trim() ||
      typeof scene.endCard.signoff !== 'string' || !scene.endCard.signoff.trim()
    )) {
      throw new Error(`Scene ${scene.id}: endCard needs a headline and signoff`);
    }
    if (scene.endCard?.backgroundAsset !== undefined && project.assets[scene.endCard.backgroundAsset]?.kind !== 'video') {
      throw new Error(`Scene ${scene.id}: endCard.backgroundAsset must reference a video`);
    }
    if (scene.endCard?.trimStartSeconds !== undefined && (!Number.isFinite(scene.endCard.trimStartSeconds) || scene.endCard.trimStartSeconds < 0)) {
      throw new Error(`Scene ${scene.id}: endCard.trimStartSeconds must be nonnegative`);
    }
    if (scene.endRoll !== undefined) {
      const ending = scene.endRoll;
      if (!isObject(ending) || typeof ending.headline !== 'string' || !ending.headline.trim() ||
          !Number.isFinite(ending.finalSeconds) || ending.finalSeconds <= 0 || ending.finalSeconds >= sceneSeconds(scene, project)) {
        throw new Error(`Scene ${scene.id}: endRoll needs a headline and finalSeconds within the scene`);
      }
      if (project.assets[ending.musicAsset]?.kind !== 'audio') {
        throw new Error(`Scene ${scene.id}: endRoll.musicAsset must reference audio`);
      }
      if (ending.musicVolume !== undefined && (!Number.isFinite(ending.musicVolume) || ending.musicVolume < 0 || ending.musicVolume > 1)) {
        throw new Error(`Scene ${scene.id}: endRoll.musicVolume must be 0–1`);
      }
    }
    sceneSeconds(scene, project);
    if (scene.background?.asset) {
      const kind = project.assets[scene.background.asset]?.kind;
      if (!['image', 'video'].includes(kind)) throw new Error(`Scene ${scene.id}: background asset must be image or video`);
      if (scene.background.trimStartSeconds !== undefined && (!Number.isFinite(scene.background.trimStartSeconds) || scene.background.trimStartSeconds < 0)) {
        throw new Error(`Scene ${scene.id}: trimStartSeconds must be nonnegative`);
      }
      if (scene.background.volume !== undefined && (!Number.isFinite(scene.background.volume) || scene.background.volume < 0 || scene.background.volume > 1)) {
        throw new Error(`Scene ${scene.id}: background volume must be 0–1`);
      }
    } else if (scene.background && typeof scene.background.color !== 'string') {
      throw new Error(`Scene ${scene.id}: background needs an asset or color`);
    }
    if (scene.backgroundCuts !== undefined) {
      if (!Array.isArray(scene.backgroundCuts) || scene.backgroundCuts.length === 0 || scene.backgroundCuts[0]?.atSeconds !== 0) {
        throw new Error(`Scene ${scene.id}: backgroundCuts must start at 0`);
      }
      let previous = -1;
      for (const cut of scene.backgroundCuts) {
        if (!isObject(cut) || !Number.isFinite(cut.atSeconds) || cut.atSeconds <= previous || cut.atSeconds >= sceneSeconds(scene, project)) {
          throw new Error(`Scene ${scene.id}: backgroundCuts must have increasing times within the scene`);
        }
        if (!['image', 'video'].includes(project.assets[cut.asset]?.kind)) {
          throw new Error(`Scene ${scene.id}: background cut must reference image or video`);
        }
        if (cut.trimStartSeconds !== undefined && (!Number.isFinite(cut.trimStartSeconds) || cut.trimStartSeconds < 0)) {
          throw new Error(`Scene ${scene.id}: background cut trimStartSeconds must be nonnegative`);
        }
        previous = cut.atSeconds;
      }
    }
    if (scene.inset !== undefined) {
      if (!isObject(scene.inset) || project.assets[scene.inset.asset]?.kind !== 'image') {
        throw new Error(`Scene ${scene.id}: inset.asset must reference an image`);
      }
      if (scene.inset.position !== undefined && !['left', 'right'].includes(scene.inset.position)) {
        throw new Error(`Scene ${scene.id}: inset.position must be left or right`);
      }
      if (scene.inset.layout !== undefined && !['standard', 'feature'].includes(scene.inset.layout)) {
        throw new Error(`Scene ${scene.id}: inset.layout must be standard or feature`);
      }
      if (scene.inset.width !== undefined && (!Number.isFinite(scene.inset.width) || scene.inset.width < 100 || scene.inset.width > project.width)) {
        throw new Error(`Scene ${scene.id}: inset.width must fit within the frame`);
      }
      if (scene.inset.aspectRatio !== undefined && (!Number.isFinite(scene.inset.aspectRatio) || scene.inset.aspectRatio <= 0)) {
        throw new Error(`Scene ${scene.id}: inset.aspectRatio must be positive`);
      }
      if (scene.inset.reveal !== undefined && typeof scene.inset.reveal !== 'boolean') {
        throw new Error(`Scene ${scene.id}: inset.reveal must be a boolean`);
      }
    }
    if (scene.insetSegments !== undefined) {
      if (!Array.isArray(scene.insetSegments)) throw new Error(`Scene ${scene.id}: insetSegments must be an array`);
      for (const inset of scene.insetSegments) {
        if (!isObject(inset) || project.assets[inset.asset]?.kind !== 'image') {
          throw new Error(`Scene ${scene.id}: inset segment must reference an image`);
        }
        if (!Number.isFinite(inset.atSeconds) || inset.atSeconds < 0 || !Number.isFinite(inset.durationSeconds) || inset.durationSeconds <= 0 || inset.atSeconds + inset.durationSeconds > sceneSeconds(scene, project) + 0.01) {
          throw new Error(`Scene ${scene.id}: inset segment timing must fit within the scene`);
        }
        if (inset.position !== undefined && !['left', 'right'].includes(inset.position)) {
          throw new Error(`Scene ${scene.id}: inset segment position must be left or right`);
        }
        if (inset.layout !== undefined && !['standard', 'feature'].includes(inset.layout)) {
          throw new Error(`Scene ${scene.id}: inset segment layout must be standard or feature`);
        }
        if (inset.width !== undefined && (!Number.isFinite(inset.width) || inset.width < 100 || inset.width > project.width)) {
          throw new Error(`Scene ${scene.id}: inset segment width must fit within the frame`);
        }
        if (inset.aspectRatio !== undefined && (!Number.isFinite(inset.aspectRatio) || inset.aspectRatio <= 0)) {
          throw new Error(`Scene ${scene.id}: inset segment aspectRatio must be positive`);
        }
        if (inset.reveal !== undefined && typeof inset.reveal !== 'boolean') {
          throw new Error(`Scene ${scene.id}: inset segment reveal must be a boolean`);
        }
      }
    }
    if (scene.narration !== undefined && !isObject(scene.narration)) throw new Error(`Scene ${scene.id}: narration must be an object`);
    for (const key of ['text', 'speechText']) {
      if (scene.narration?.[key] !== undefined && (typeof scene.narration[key] !== 'string' || !scene.narration[key].trim())) {
        throw new Error(`Scene ${scene.id}: narration.${key} must be nonempty text`);
      }
    }
    if (scene.narration?.asset && project.assets[scene.narration.asset]?.kind !== 'audio') {
      throw new Error(`Scene ${scene.id}: narration asset must be audio`);
    }
    const audio = project.assets[scene.narration?.asset];
    if ((audio?.narrationText !== undefined && audio.narrationText !== scene.narration.text) ||
        (audio?.speechText !== undefined && audio.speechText !== scene.narration.speechText)) {
      throw new Error(`Scene ${scene.id}: narration audio metadata is stale; regenerate the WAV`);
    }
    if (scene.narration?.volume !== undefined && (!Number.isFinite(scene.narration.volume) || scene.narration.volume < 0 || scene.narration.volume > 1)) {
      throw new Error(`Scene ${scene.id}: narration volume must be 0–1`);
    }
    if (scene.motion !== undefined && (!isObject(scene.motion) || ['backgroundZoom', 'textEntrance', 'fadeEdges'].some((key) => scene.motion[key] !== undefined && typeof scene.motion[key] !== 'boolean'))) {
      throw new Error(`Scene ${scene.id}: motion flags must be booleans`);
    }
    if (scene.sfx !== undefined && !Array.isArray(scene.sfx)) throw new Error(`Scene ${scene.id}: sfx must be an array`);
    for (const effect of scene.sfx ?? []) {
      if (!isObject(effect) || project.assets[effect.asset]?.kind !== 'audio') throw new Error(`Scene ${scene.id}: sfx asset must be audio`);
      if (effect.atSeconds !== undefined && (!Number.isFinite(effect.atSeconds) || effect.atSeconds < 0 || effect.atSeconds >= sceneSeconds(scene, project))) {
        throw new Error(`Scene ${scene.id}: sfx.atSeconds must be within the scene`);
      }
      if (effect.volume !== undefined && (!Number.isFinite(effect.volume) || effect.volume < 0 || effect.volume > 1)) {
        throw new Error(`Scene ${scene.id}: sfx.volume must be 0–1`);
      }
    }
    if (!Array.isArray(scene.overlays)) throw new Error(`Scene ${scene.id}: overlays must be an array`);
    for (const overlay of scene.overlays) {
      if (!isObject(overlay) || !['title', 'intro-title', 'label', 'headline', 'caption', 'statement', 'question', 'stat', 'steps', 'pair', 'transition'].includes(overlay.type)) {
        throw new Error(`Scene ${scene.id}: invalid overlay type`);
      }
      if (typeof overlay.text !== 'string' || !overlay.text.trim()) {
        throw new Error(`Scene ${scene.id}: overlay text is required`);
      }
      if (overlay.price !== undefined) {
        if (overlay.type !== 'label') throw new Error(`Scene ${scene.id}: price is only supported on label overlays`);
        validatePriceLabel(overlay, scene, project);
      } else if (overlay.announcePrice !== undefined) {
        throw new Error(`Scene ${scene.id}: announcePrice requires structured price`);
      }
      if (overlay.type === 'transition' && (scene.narration !== undefined || (scene.background?.volume ?? 0) > 0 ||
          scene.backgroundCuts?.some((cut) => (cut.volume ?? 0) > 0) ||
          scene.overlays.some((item) => item.type === 'caption'))) {
        throw new Error(`Scene ${scene.id}: transition must not contain narration, captions, or trailer audio`);
      }
      if (overlay.type === 'intro-title') {
        for (const key of ['badge', 'eyebrow', 'line1', 'line2', 'count', 'periodLabel', 'periodText']) {
          if (typeof overlay[key] !== 'string' || !overlay[key].trim()) {
            throw new Error(`Scene ${scene.id}: intro-title.${key} is required`);
          }
        }
        if (overlay.accentColor !== undefined && !/^#[0-9a-fA-F]{6}$/.test(overlay.accentColor)) {
          throw new Error(`Scene ${scene.id}: intro-title.accentColor must be a six-digit hex color`);
        }
      }
      if (overlay.type === 'steps' && (!Array.isArray(overlay.items) || overlay.items.length < 2 || overlay.items.length > 4 || overlay.items.some((item) => typeof item !== 'string' || !item.trim()))) {
        throw new Error(`Scene ${scene.id}: steps needs two to four nonempty items`);
      }
      if (overlay.type === 'pair' && (!Array.isArray(overlay.items) || overlay.items.length !== 2 || overlay.items.some((item) => typeof item !== 'string' || !item.trim()))) {
        throw new Error(`Scene ${scene.id}: pair needs two nonempty items`);
      }
    }
  }
  return project;
}

export const totalFrames = (project) =>
  Math.max(1, project.scenes.reduce((sum, scene) => sum + framesFor(sceneSeconds(scene, project), project.fps), 0));
