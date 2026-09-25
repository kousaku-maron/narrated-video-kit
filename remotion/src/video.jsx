import React from 'react';
import {AbsoluteFill, Img, Series, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {useAudioData} from '@remotion/media-utils';
import {framesFor, sceneSeconds, totalFrames} from './project.js';
import {narrationCaptionCues} from './captions.js';

const font = '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';

const between = (value, start, end) => Math.min(1, Math.max(0, (value - start) / Math.max(1, end - start)));
const easeOut = (progress) => 1 - Math.pow(1 - progress, 3);

function Background({scene, assets, fps, frame, duration}) {
  const background = scene.background ?? {color: '#101820'};
  const asset = background.asset ? assets[background.asset] : null;
  const fit = background.fit ?? 'cover';
  const clean = scene.overlays.length === 0;
  if (asset?.kind === 'image') {
    const progress = frame / Math.max(1, duration - 1);
    const zoom = scene.motion?.backgroundZoom ? 1.02 + progress * 0.04 : 1;
    return <Img src={staticFile(asset.src)} style={{width: '100%', height: '100%', objectFit: fit, objectPosition: background.position ?? 'center', transform: `scale(${zoom})`, filter: clean ? 'brightness(1.16) contrast(1.04)' : undefined}} />;
  }
  if (asset?.kind === 'video') {
    return (
      <Video
        src={staticFile(asset.src)}
        trimBefore={Math.round((background.trimStartSeconds ?? 0) * fps)}
        muted={(background.volume ?? 0) === 0}
        volume={background.volume ?? 0}
        loop={background.loop ?? false}
        objectFit={fit}
        style={{width: '100%', height: '100%', filter: clean ? 'brightness(1.16) contrast(1.04)' : undefined}}
      />
    );
  }
  return <AbsoluteFill style={{background: background.color ?? '#101820'}} />;
}

function ImageInset({inset, assets, frame, project}) {
  const reveal = easeOut(between(frame, 2, 16));
  const feature = inset.layout === 'feature';
  const width = inset.width ?? (feature ? 1320 : 950);
  const placement = feature
    ? {left: Math.round((project.width - width) / 2), top: 95}
    : {top: 105, [inset.position === 'left' ? 'left' : 'right']: 80};
  return (
    <div style={{position: 'absolute', ...placement, width, aspectRatio: '16 / 9', overflow: 'hidden', border: '4px solid #f4f0e7', boxShadow: '0 18px 55px #000b', opacity: reveal, transform: `translateY(${Math.round((1 - reveal) * 28)}px)`}}>
      <Img src={staticFile(assets[inset.asset].src)} style={{width: '100%', height: '100%', objectFit: feature ? 'contain' : 'cover'}} />
    </div>
  );
}

function Overlay({item, accent, frame, animated, index, avatar, hasInset, opening}) {
  const delay = item.type === 'headline' ? 10 : item.type === 'label' ? 4 : 2;
  const progress = animated ? easeOut(between(frame, delay + index * 2, delay + 14 + index * 2)) : 1;
  const enter = {opacity: progress, transform: `translateY(${Math.round((1 - progress) * (item.type === 'headline' ? 45 : 25))}px)`};
  if (['statement', 'question', 'stat', 'steps', 'pair'].includes(item.type)) {
    const left = 66;
    const right = avatar ? 435 : 66;
    const plate = {background: 'rgba(8,16,24,.8)', boxShadow: '0 12px 30px #0007', color: '#f9f6ef'};
    const meta = (value) => <div style={{fontSize: 22, color: accent, fontWeight: 900, letterSpacing: 2, marginBottom: 9}}>{value}</div>;
    if ((item.type === 'statement' && !opening) || item.type === 'question') return (
      <div style={{position: 'absolute', left: 100, right: avatar ? 430 : 100, bottom: 82, textAlign: 'center', color: '#fff', fontSize: item.text.length > 19 ? 57 : 70, lineHeight: 1.24, fontWeight: 900, WebkitTextStroke: '4px #101820', paintOrder: 'stroke fill', textShadow: '0 5px 16px #000c', ...enter}}>{item.text}</div>
    );
    if (item.type === 'statement') return (
      <div style={{position: 'absolute', bottom: 75, left, right, maxWidth: 1450, padding: '24px 34px', borderLeft: `8px solid ${accent}`, ...plate, ...enter}}>
        {meta(item.meta)}
        <div style={{fontSize: item.text.length > 22 ? 53 : 65, lineHeight: 1.3, fontWeight: 900}}>{item.text}</div>
      </div>
    );
    if (item.type === 'stat') return (
      <div style={{position: 'absolute', top: 124, left, maxWidth: 780, padding: '16px 22px', borderLeft: `6px solid ${accent}`, ...plate, ...enter}}>
        <div style={{fontSize: 65, lineHeight: 1.04, color: '#fff', fontWeight: 900}}>{item.text}</div>
        <div style={{fontSize: 25, lineHeight: 1.35, fontWeight: 800, marginTop: 6, color: '#e5e5e5'}}>{item.meta}</div>
      </div>
    );
    if (item.type === 'steps') {
      const columns = hasInset ? item.items.length : Math.min(2, item.items.length);
      return (
        <div style={hasInset
          ? {position: 'absolute', left, right: avatar ? 435 : 160, bottom: 72, maxWidth: 1600, ...enter}
          : {position: 'absolute', left: 66, top: 135, width: 1280, ...enter}}>
          <div style={{display: 'inline-block', padding: '11px 19px', marginBottom: 10, ...plate, fontSize: 35, fontWeight: 900}}>{item.text}</div>
          <div style={{display: 'grid', gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 12}}>
            {item.items.map((step, stepIndex) => <div key={`${step}-${stepIndex}`} style={{minWidth: 0, minHeight: hasInset ? 145 : 174, padding: hasInset ? '20px 18px' : '23px 27px', borderTop: '5px solid #d4dce0', ...plate}}>
              <div style={{fontSize: 19, color: accent, fontWeight: 900, marginBottom: 9}}>{String(stepIndex + 1).padStart(2, '0')}</div>
              <div style={{fontSize: hasInset ? (step.length > 9 ? 30 : 37) : 43, lineHeight: 1.25, fontWeight: 900}}>{step}</div>
            </div>)}
          </div>
        </div>
      );
    }
    return (
      <div style={{position: 'absolute', left, right: avatar ? 435 : 180, top: 145, maxWidth: 1550, ...enter}}>
        {meta(item.text)}
        <div style={{display: 'flex', gap: 16}}>
          {item.items.map((value, valueIndex) => <div key={`${value}-${valueIndex}`} style={{flex: 1, minHeight: 160, padding: '25px 30px', borderTop: '5px solid #d4dce0', display: 'flex', alignItems: 'center', fontSize: value.length > 13 ? 40 : 50, lineHeight: 1.3, fontWeight: 900, ...plate}}>{value}</div>)}
        </div>
      </div>
    );
  }
  if (item.type === 'title') {
    return (
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', padding: 100, background: 'linear-gradient(90deg, rgba(0,0,0,.68), rgba(0,0,0,.18))'}}>
        <div style={{width: '100%', textAlign: 'center', ...enter}}>
          {item.eyebrow && <div style={{color: accent, fontSize: 34, fontWeight: 800, letterSpacing: 5, marginBottom: 24}}>{item.eyebrow}</div>}
          <div style={{fontSize: 102, fontWeight: 900, lineHeight: 1.18, color: '#fff', textShadow: '0 7px 24px #0009', whiteSpace: 'pre-wrap'}}>{item.text}</div>
          {item.subtitle && <div style={{fontSize: 38, color: '#fff', marginTop: 34}}>{item.subtitle}</div>}
        </div>
      </AbsoluteFill>
    );
  }
  if (item.type === 'label') {
    return (
      <div style={{position: 'absolute', top: 58, left: 66, maxWidth: 1000, background: 'rgba(8,16,24,.84)', borderLeft: `10px solid ${accent}`, padding: '20px 27px', boxShadow: '0 8px 30px #0006', ...enter}}>
        <div style={{fontSize: 38, fontWeight: 900, color: '#fff'}}>{item.text}</div>
        {item.meta && <div style={{fontSize: 22, fontWeight: 700, color: '#d3dee5', marginTop: 8}}>{item.meta}</div>}
      </div>
    );
  }
  if (item.type === 'headline') {
    return (
      <div style={{position: 'absolute', bottom: 65, left: 66, right: 66, padding: '30px 40px', background: 'linear-gradient(90deg, rgba(0,0,0,.82), rgba(0,0,0,.45))', borderBottom: `9px solid ${accent}`, ...enter}}>
        <div style={{fontSize: 64, lineHeight: 1.25, fontWeight: 900, color: '#fff', textShadow: '0 4px 12px #000', whiteSpace: 'pre-wrap'}}>{item.text}</div>
      </div>
    );
  }
  return (
    <div style={{position: 'absolute', bottom: 85, left: 80, right: avatar ? 430 : 80, textAlign: 'center', fontSize: 48, fontWeight: 800, color: '#fff', textShadow: '0 3px 8px #000, 0 0 20px #000', whiteSpace: 'pre-wrap', ...enter}}>{item.text}</div>
  );
}

function NarrationCaption({text, durationSeconds, fps, sceneFrames, frame, avatar}) {
  const cue = narrationCaptionCues(text, durationSeconds, fps, sceneFrames).find(({from, to}) => frame >= from && frame < to);
  if (!cue) return null;
  const opacity = Math.min(1, between(frame, cue.from, cue.from + 3), between(cue.to - frame, 0, 3));
  return (
    <div style={{position: 'absolute', left: 80, right: avatar ? 430 : 80, bottom: 76, textAlign: 'center', fontSize: 51, lineHeight: 1.28, fontWeight: 900, color: '#fff', WebkitTextStroke: '4px #101820', paintOrder: 'stroke fill', textShadow: '0 4px 14px #000e', whiteSpace: 'pre-wrap', opacity, pointerEvents: 'none'}}>
      {cue.text}
    </div>
  );
}

function NarrationMouth({src, persona, frame, fps, style}) {
  const audioData = useAudioData(src);
  const samples = audioData?.channelWaveforms[0];
  let state = 'closed';
  if (samples?.length) {
    const from = Math.max(0, Math.floor(frame * audioData.sampleRate / fps));
    const to = Math.min(samples.length, Math.floor((frame + 1) * audioData.sampleRate / fps));
    let power = 0;
    let count = 0;
    for (let i = from; i < to; i += 8) {
      power += samples[i] * samples[i];
      count++;
    }
    const rms = count ? Math.sqrt(power / count) : 0;
    state = rms >= 0.12 ? 'open' : rms >= 0.025 ? 'half' : 'closed';
  }
  return <Img src={staticFile(`pelsona/${persona}/mouth_${state}.png`)} style={style} />;
}

function Avatar({persona, narration, project, frame, visibleFrame}) {
  const height = Math.round(project.height * 0.36);
  const width = Math.round(height * 1186 / 1327);
  const imageStyle = {position: 'absolute', inset: 0, width: '100%', height: '100%'};
  return (
    <div style={{position: 'absolute', right: Math.round(project.width * 0.02), bottom: 0, width, height, opacity: easeOut(between(visibleFrame, 0, 9)), pointerEvents: 'none'}}>
      <Img src={staticFile(`pelsona/${persona}/base.png`)} style={imageStyle} />
      {narration
        ? <NarrationMouth src={staticFile(narration.src)} persona={persona} frame={frame} fps={project.fps} style={imageStyle} />
        : <Img src={staticFile(`pelsona/${persona}/mouth_closed.png`)} style={imageStyle} />}
    </div>
  );
}

function PersistentAvatar({project}) {
  const frame = useCurrentFrame();
  let start = 0;
  let visibleStart = 0;
  let wasVisible = false;
  for (const scene of project.scenes) {
    const duration = framesFor(sceneSeconds(scene, project), project.fps);
    if (scene.avatar && !wasVisible) visibleStart = start;
    if (frame < start + duration) {
      if (!scene.avatar) return null;
      const narration = scene.narration?.asset ? project.assets[scene.narration.asset] : null;
      return <Avatar persona={project.persona} narration={narration} project={project} frame={frame - start} visibleFrame={frame - visibleStart} />;
    }
    start += duration;
    wasVisible = Boolean(scene.avatar);
  }
  return null;
}

function activeChapterIntro(project, frame) {
  if (!project.chapterIntro) return null;
  const introFrames = framesFor(project.chapterIntro.durationSeconds, project.fps);
  let start = 0;
  for (const scene of project.scenes) {
    start += framesFor(sceneSeconds(scene, project), project.fps);
    const sceneStart = start - framesFor(sceneSeconds(scene, project), project.fps);
    if (scene.chapterStart && frame >= sceneStart && frame < sceneStart + introFrames) {
      return {label: scene.chapterLabel, local: frame - sceneStart, duration: introFrames};
    }
    if (sceneStart > frame) break;
  }
  return null;
}

function PersistentChapter({project}) {
  const frame = useCurrentFrame();
  if (activeChapterIntro(project, frame)) return null;
  let start = 0;
  for (const scene of project.scenes) {
    start += framesFor(sceneSeconds(scene, project), project.fps);
    if (frame >= start) continue;
    if (!scene.chapterLabel) return null;
    const accent = project.theme?.accent ?? '#f6c84c';
    return <div style={{position: 'absolute', top: 0, left: 0, maxWidth: 900, padding: '10px 26px 12px 22px', background: 'rgba(33,37,40,.94)', borderLeft: `12px solid ${accent}`, color: '#fff', fontFamily: font, fontSize: 40, lineHeight: 1.2, fontWeight: 900, boxShadow: '0 5px 18px #0009', pointerEvents: 'none'}}>{scene.chapterLabel}</div>;
  }
  return null;
}

function ChapterIntro({project}) {
  const frame = useCurrentFrame();
  const intro = activeChapterIntro(project, frame);
  if (intro) {
      const {label, local, duration} = intro;
      const opacity = Math.min(between(local, 0, 9), between(duration - local, 0, 12));
      const accent = project.theme?.accent ?? '#f6c84c';
      return <AbsoluteFill style={{fontFamily: font, opacity, pointerEvents: 'none'}}>
        <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(3,8,12,.66), rgba(3,8,12,.62) 55%, rgba(3,8,12,0) 85%)'}} />
        <div style={{position: 'absolute', left: 145, right: 440, top: 235, height: 470, display: 'flex', alignItems: 'center'}}>
          <div style={{width: 15, height: 180, background: accent, marginRight: 45, boxShadow: '0 4px 22px #0008'}} />
          <div style={{fontSize: 108, lineHeight: 1.15, fontWeight: 900, color: '#fff', WebkitTextStroke: '2px #101820', paintOrder: 'stroke fill', textShadow: '0 8px 30px #000c', transform: `translateX(${Math.round((1 - easeOut(between(local, 0, 13))) * 38)}px)`}}>{label}</div>
        </div>
      </AbsoluteFill>;
  }
  return null;
}

function EndCard({scene, frame, project, accent}) {
  if (!scene.endCard) return null;
  const fps = project.fps;
  const textOpacity = easeOut(between(frame, Math.round(0.35 * fps), Math.round(1.25 * fps)));
  const videoOpacity = easeOut(between(frame, 0, Math.round(0.7 * fps)));
  const background = project.assets[scene.endCard.backgroundAsset];
  return <AbsoluteFill style={{color: '#fff', pointerEvents: 'none'}}>
    <AbsoluteFill style={{opacity: videoOpacity}}>
      {background && <Video src={staticFile(background.src)} trimBefore={Math.round((scene.endCard.trimStartSeconds ?? 0) * fps)} muted volume={0} objectFit="cover" style={{width: '100%', height: '100%', filter: 'saturate(.75) contrast(1.05)'}} />}
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(4,8,12,.88) 0%, rgba(4,8,12,.67) 44%, rgba(4,8,12,.39) 100%)'}} />
    </AbsoluteFill>
    <div style={{position: 'absolute', left: 125, top: 222, width: 1230, opacity: textOpacity, transform: `translateY(${Math.round((1 - textOpacity) * 22)}px)`}}>
      <div style={{fontSize: 27, fontWeight: 800, letterSpacing: 6, color: accent, marginBottom: 30}}>{scene.endCard.eyebrow}</div>
      <div style={{width: 156, height: 7, background: accent, marginBottom: 42}} />
      <div style={{fontSize: 104, fontWeight: 900, lineHeight: 1.32, whiteSpace: 'pre-wrap', textShadow: '0 7px 25px #000d'}}>{scene.endCard.headline}</div>
      <div style={{fontSize: 40, fontWeight: 700, marginTop: 45, color: '#e8e4da', textShadow: '0 4px 16px #000d'}}>{scene.endCard.signoff}</div>
    </div>
    <div style={{position: 'absolute', left: 125, bottom: 78, width: 1150, height: 2, background: 'rgba(255,255,255,.35)', opacity: textOpacity}}>
      <div style={{width: `${Math.min(100, 100 * frame / Math.max(1, framesFor(scene.durationSeconds, fps) - 1))}%`, height: '100%', background: accent}} />
    </div>
  </AbsoluteFill>;
}

function ContinuousBackground({project, length}) {
  const playlist = project.backgroundPlaylist;
  if (!playlist) return null;
  const segments = [];
  let start = 0;
  for (let index = 0; start < length; index++) {
    const clip = playlist[index % playlist.length];
    const duration = Math.min(length - start, Math.max(1, Math.floor(clip.durationSeconds * project.fps)));
    segments.push(<Sequence key={`${clip.asset}-${index}`} from={start} durationInFrames={duration}>
      <Video src={staticFile(project.assets[clip.asset].src)} muted volume={0} objectFit="cover" style={{width: '100%', height: '100%', filter: 'brightness(1.08) contrast(1.03)'}} />
    </Sequence>);
    start += duration;
  }
  return <AbsoluteFill>
    {segments}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,8,12,.1), rgba(4,8,12,.02) 55%, rgba(4,8,12,.48))', pointerEvents: 'none'}} />
  </AbsoluteFill>;
}

function Scene({scene, project}) {
  const frame = useCurrentFrame();
  const duration = framesFor(sceneSeconds(scene, project), project.fps);
  const accent = project.theme?.accent ?? '#f6c84c';
  const narration = scene.narration?.asset ? project.assets[scene.narration.asset] : null;
  const edgeFade = scene.motion?.fadeEdges ? Math.max(1 - between(frame, 0, 8), between(frame, duration - 9, duration - 1)) : 0;
  return (
    <AbsoluteFill style={{fontFamily: font, overflow: 'hidden', background: project.backgroundPlaylist ? 'transparent' : '#101820'}}>
      {!project.backgroundPlaylist && <Background scene={scene} assets={project.assets} fps={project.fps} frame={frame} duration={duration} />}
      {scene.chapterLabel && project.chapterPlacement !== 'top-left-fixed' && <div style={{position: 'absolute', top: 54, left: 66, padding: '11px 18px', background: 'rgba(8,16,24,.83)', borderLeft: `6px solid ${accent}`, color: '#fff', fontSize: 27, fontWeight: 900, boxShadow: '0 5px 16px #0007'}}>{scene.chapterLabel}</div>}
      {scene.inset && (!scene.chapterStart || frame >= framesFor(project.chapterIntro?.durationSeconds ?? 0, project.fps)) && <ImageInset inset={scene.inset} assets={project.assets} frame={frame - (scene.chapterStart ? framesFor(project.chapterIntro?.durationSeconds ?? 0, project.fps) : 0)} project={project} />}
      {scene.overlays.map((item, index) => <Overlay key={`${item.type}-${index}`} item={item} accent={accent} frame={frame} animated={scene.motion?.textEntrance} index={index} avatar={scene.avatar} hasInset={Boolean(scene.inset)} opening={scene.id === 'opening-01'} />)}
      {project.captions?.mode === 'spoken' && narration && scene.narration.text && <NarrationCaption text={scene.narration.text} durationSeconds={narration.durationSeconds} fps={project.fps} sceneFrames={duration} frame={frame} avatar={scene.avatar} />}
      {narration && <Audio src={staticFile(narration.src)} volume={scene.narration.volume ?? 1} />}
      {(scene.sfx ?? []).map((effect, index) => (
        <Sequence key={`${effect.asset}-${index}`} from={Math.round((effect.atSeconds ?? 0) * project.fps)}>
          <Audio src={staticFile(project.assets[effect.asset].src)} volume={effect.volume ?? 0.2} />
        </Sequence>
      ))}
      <EndCard scene={scene} frame={frame} project={project} accent={accent} />
      {edgeFade > 0 && <AbsoluteFill style={{backgroundColor: '#050607', opacity: edgeFade, pointerEvents: 'none'}} />}
    </AbsoluteFill>
  );
}

export function IndieVideo(project) {
  const frame = useCurrentFrame();
  const soundtrack = project.soundtrack;
  const length = totalFrames(project);
  const musicVolume = soundtrack && ((frame) => {
    const fadeIn = (soundtrack.fadeInSeconds ?? 0) * project.fps;
    const fadeOut = (soundtrack.fadeOutSeconds ?? 0) * project.fps;
    const start = fadeIn > 0 ? Math.min(1, frame / fadeIn) : 1;
    const end = fadeOut > 0 ? Math.min(1, (length - 1 - frame) / fadeOut) : 1;
    return (soundtrack.volume ?? 0.12) * Math.max(0, Math.min(start, end));
  });
  return (
    <AbsoluteFill style={{background: '#101820'}}>
      <ContinuousBackground project={project} length={length} />
      {soundtrack && <Audio src={staticFile(project.assets[soundtrack.asset].src)} loop={soundtrack.loop ?? true} volume={musicVolume} />}
      <Series>
        {project.scenes.map((scene) => (
          <Series.Sequence key={scene.id} durationInFrames={framesFor(sceneSeconds(scene, project), project.fps)} name={scene.id}>
            <Scene scene={scene} project={project} />
          </Series.Sequence>
        ))}
      </Series>
      <ChapterIntro project={project} />
      {project.persona && <PersistentAvatar project={project} />}
      {project.chapterPlacement === 'top-left-fixed' && <PersistentChapter project={project} />}
      <AbsoluteFill style={{backgroundColor: '#050607', opacity: between(frame, length - Math.round(project.fps * 0.65), length - 1), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
}
