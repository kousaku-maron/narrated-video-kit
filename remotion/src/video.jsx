import React from 'react';
import {AbsoluteFill, Img, Series, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Audio, Video} from '@remotion/media';
import {useAudioData} from '@remotion/media-utils';
import {framesFor, sceneSeconds, totalFrames} from './project.js';
import {narrationCaptionCues} from './captions.js';
import {priceParts} from './pricing.js';

const font = '"Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif';

const between = (value, start, end) => Math.min(1, Math.max(0, (value - start) / Math.max(1, end - start)));
const easeOut = (progress) => 1 - Math.pow(1 - progress, 3);

function Background({scene, assets, fps, frame, duration}) {
  const background = scene.background ?? {color: '#101820'};
  const asset = background.asset ? assets[background.asset] : null;
  const fit = background.fit ?? 'cover';
  const clean = scene.overlays.length === 0 && !scene.rawBackground;
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

function BackgroundCuts({scene, project, frame, duration}) {
  return scene.backgroundCuts.map((cut, index) => {
    const from = Math.round(cut.atSeconds * project.fps);
    const until = index + 1 < scene.backgroundCuts.length
      ? Math.round(scene.backgroundCuts[index + 1].atSeconds * project.fps)
      : duration;
    return <Sequence key={`${cut.asset}-${index}`} from={from} durationInFrames={until - from}>
      <AbsoluteFill>
        <Background scene={{...scene, background: cut}} assets={project.assets} fps={project.fps} frame={frame - from} duration={until - from} />
      </AbsoluteFill>
    </Sequence>;
  });
}

function ImageInset({inset, assets, frame, project}) {
  const reveal = inset.reveal === false ? 1 : easeOut(between(frame, 2, 16));
  const feature = inset.layout === 'feature';
  const width = inset.width ?? (feature ? 1320 : 950);
  const placement = feature
    ? {left: Math.round((project.width - width) / 2), top: 95}
    : {top: 105, [inset.position === 'left' ? 'left' : 'right']: 80};
  return (
    <div style={{position: 'absolute', ...placement, width, aspectRatio: inset.aspectRatio ?? 16 / 9, overflow: 'hidden', border: '4px solid #f4f0e7', boxShadow: '0 18px 55px #000b', opacity: reveal, transform: `translateY(${Math.round((1 - reveal) * 28)}px)`}}>
      <Img src={staticFile(assets[inset.asset].src)} style={{width: '100%', height: '100%', objectFit: feature ? 'contain' : 'cover'}} />
    </div>
  );
}

function Overlay({item, accent, frame, duration, animated, index, avatar, hasInset, opening}) {
  const delay = item.type === 'headline' ? 10 : item.type === 'label' ? 4 : 2;
  const progress = animated ? easeOut(between(frame, delay + index * 2, delay + 14 + index * 2)) : 1;
  const enter = {opacity: progress, transform: `translateY(${Math.round((1 - progress) * (item.type === 'headline' ? 45 : 25))}px)`};
  if (item.type === 'transition') {
    const fadeIn = easeOut(between(frame, 0, 9));
    const fadeOut = 1 - easeOut(between(frame, duration - 10, duration - 1));
    const opacity = Math.min(fadeIn, fadeOut);
    return <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
      <div style={{width: 1110, minHeight: 290, boxSizing: 'border-box', border: '6px solid #fff', background: 'rgba(6,14,22,.38)', boxShadow: '0 14px 38px #0008', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '34px 58px', opacity, transform: `scale(${0.975 + 0.025 * fadeIn})`}}>
        {item.meta && <div style={{color: '#fff', fontSize: 27, fontWeight: 800, letterSpacing: 5, textShadow: '0 2px 8px #000b', marginBottom: 16}}>{item.meta}</div>}
        <div style={{color: '#fff', fontSize: item.text.length > 20 ? 65 : item.text.length > 13 ? 75 : 88, lineHeight: 1.17, fontWeight: 900, textAlign: 'center', textShadow: '0 4px 16px #000d', whiteSpace: 'pre-wrap'}}>{item.text}</div>
      </div>
    </AbsoluteFill>;
  }
  if (item.type === 'intro-title') {
    const introAccent = item.accentColor ?? '#f05a2a';
    return <AbsoluteFill style={{pointerEvents: 'none', fontFamily: font}}>
      <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,6,8,.05) 0%, rgba(5,6,8,.12) 30%, rgba(5,6,8,.43) 51%, rgba(5,6,8,.54) 67%, rgba(5,6,8,.56) 100%)'}} />
      <AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(5,6,8,.56), transparent 26%)'}} />
      <div style={{position: 'absolute', left: 88, top: 78, padding: '18px 27px', borderRadius: 13, background: introAccent, boxShadow: '0 8px 24px #0008', color: '#fff', fontSize: 30, fontWeight: 900, lineHeight: 1.3, whiteSpace: 'nowrap'}}>{item.badge}</div>
      <div style={{position: 'absolute', top: 195, right: 91, width: 20, height: 430, background: introAccent}} />
      <div style={{position: 'absolute', top: 192, left: 885, width: 865, color: '#f8f8f6', textAlign: 'right', opacity: easeOut(between(frame, 2, 20)), textShadow: '0 4px 14px #0007'}}>
        <div style={{color: introAccent, fontFamily: '"DIN Condensed", "Arial Narrow", sans-serif', fontSize: 30, fontWeight: 700, letterSpacing: 5, marginBottom: 41}}>{item.eyebrow}</div>
        <div style={{fontSize: 65, fontWeight: 800, letterSpacing: '-.07em', lineHeight: 1.31, whiteSpace: 'nowrap'}}>{item.line1}</div>
        <div style={{fontSize: 94, fontWeight: 900, letterSpacing: '-.075em', lineHeight: 1.32, whiteSpace: 'nowrap'}}>{item.line2}</div>
        <div style={{fontSize: 146, fontWeight: 900, letterSpacing: '-.05em', lineHeight: 1.14, whiteSpace: 'nowrap'}}>{item.count}</div>
      </div>
      <div style={{position: 'absolute', top: 686, right: 420, width: 750, textAlign: 'right', whiteSpace: 'nowrap'}}>
        <div style={{width: 160, height: 2, background: '#757a81', margin: '0 0 20px auto'}} />
        <div style={{color: introAccent, fontSize: 25, fontWeight: 900, letterSpacing: '.06em', lineHeight: 1.3, textShadow: '0 2px 9px #000'}}>{item.periodLabel}</div>
        <div style={{color: '#c8c9cc', fontSize: 26, fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.5, marginTop: 4, textShadow: '0 2px 9px #000'}}>{item.periodText}</div>
      </div>
    </AbsoluteFill>;
  }
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
    const price = item.price && priceParts(item.price);
    return (
      <div style={{position: 'absolute', top: 58, left: 66, maxWidth: 1000, background: 'rgba(8,16,24,.84)', borderLeft: `10px solid ${accent}`, padding: '20px 27px', boxShadow: '0 8px 30px #0006', ...enter}}>
        <div style={{fontSize: 38, fontWeight: 900, color: '#fff'}}>{item.text}</div>
        {price && <div style={{display: 'flex', alignItems: 'baseline', gap: 14, fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 8}}>
          {price.regular && <span style={{fontSize: 22, color: '#b8c2ca', textDecoration: 'line-through'}}>{price.regular}</span>}
          <span>{price.current}</span>
          {price.discount && <span style={{color: '#ff5454'}}>{price.discount}</span>}
        </div>}
        {item.meta && <div style={{fontSize: item.sectionGame ? 31 : 22, fontWeight: item.sectionGame ? 900 : 700, color: item.sectionGame ? '#fff' : '#d3dee5', marginTop: 8}}>{item.meta}{item.discount && <span style={{color: '#ff5454'}}>（{item.discount}）</span>}</div>}
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

function CachedNarrationMouth({narration, persona, frame, fps, style}) {
  const cachedFrame = Math.floor(frame * narration.mouthFps / fps);
  const state = {o: 'open', h: 'half', c: 'closed'}[narration.mouthFrames[cachedFrame]] ?? 'closed';
  return <Img src={staticFile(`pelsona/${persona}/mouth_${state}.png`)} style={style} />;
}

function Avatar({persona, narration, project, frame, visibleFrame}) {
  const height = Math.round(project.height * 0.36);
  const width = Math.round(height * 1186 / 1327);
  const imageStyle = {position: 'absolute', inset: 0, width: '100%', height: '100%'};
  return (
    <div style={{position: 'absolute', right: Math.round(project.width * 0.02), bottom: 0, width, height, opacity: easeOut(between(visibleFrame, 0, 9)), pointerEvents: 'none'}}>
      <Img src={staticFile(`pelsona/${persona}/base.png`)} style={imageStyle} />
      {narration && !project.previewStaticAvatar
        ? narration.mouthFrames
          ? <CachedNarrationMouth narration={narration} persona={persona} frame={frame} fps={project.fps} style={imageStyle} />
          : <NarrationMouth src={staticFile(narration.src)} persona={persona} frame={frame} fps={project.fps} style={imageStyle} />
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

function activeChapterTransition(project, frame) {
  if (!project.chapterTransition) return null;
  let start = 0;
  let previousLabel = null;
  let previousSceneLabel = null;
  let majorNumber = 0;
  for (const scene of project.scenes) {
    const label = scene.chapterLabel ?? null;
    const changed = Boolean(label && previousLabel && label !== previousLabel);
    const major = changed && scene.chapterStart === true;
    if (major) majorNumber++;
    const duration = framesFor(major
      ? project.chapterTransition.durationSeconds
      : (project.chapterTransition.minorDurationSeconds ?? 0.24), project.fps);
    if (changed && frame >= start && frame < start + duration) {
      return {label, previousLabel: previousSceneLabel, local: frame - start, duration, major, majorNumber};
    }
    start += framesFor(sceneSeconds(scene, project), project.fps);
    if (start > frame) break;
    // A raw gameplay scene has no visible chapter label. Keep the last named
    // chapter so the next silent title can still enter as a major transition.
    previousSceneLabel = label;
    if (label) previousLabel = label;
  }
  return null;
}

function ChapterLabel({label, accent, opacity = 1}) {
  return <div style={{position: 'absolute', top: 0, left: 0, maxWidth: 900, padding: '10px 26px 12px 22px', background: 'rgba(33,37,40,.94)', borderLeft: `12px solid ${accent}`, color: '#fff', fontFamily: font, fontSize: 40, lineHeight: 1.2, fontWeight: 900, boxShadow: '0 5px 18px #0009', opacity, pointerEvents: 'none'}}>{label}</div>;
}

function activeChapterIntro(project, frame) {
  if (!project.chapterIntro || project.chapterTransition) return null;
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
  const transition = activeChapterTransition(project, frame);
  const accent = project.theme?.accent ?? '#f6c84c';
  if (transition) {
    const {label, previousLabel, local, duration, major} = transition;
    const exitFrames = Math.min(8, Math.max(3, Math.floor(duration * 0.4)));
    const enterStart = major ? duration - 8 : Math.max(1, exitFrames - 2);
    return <>
      {previousLabel && <ChapterLabel label={previousLabel} accent={accent} opacity={1 - easeOut(between(local, 0, exitFrames))} />}
      <ChapterLabel label={label} accent={accent} opacity={easeOut(between(local, enterStart, duration - 1))} />
    </>;
  }
  let start = 0;
  for (const scene of project.scenes) {
    start += framesFor(sceneSeconds(scene, project), project.fps);
    if (frame >= start) continue;
    if (!scene.chapterLabel) return null;
    return <ChapterLabel label={scene.chapterLabel} accent={accent} />;
  }
  return null;
}

function ChapterTransition({project}) {
  const frame = useCurrentFrame();
  const transition = activeChapterTransition(project, frame);
  if (!transition?.major) return null;
  const {label, local, duration, majorNumber} = transition;
  const enterFrames = Math.max(1, Math.round(project.fps * 0.28));
  const exitFrames = Math.max(1, Math.round(project.fps * 0.3));
  const enter = easeOut(between(local, 0, enterFrames));
  const exit = 1 - easeOut(between(local, duration - exitFrames, duration - 1));
  const visibility = Math.min(enter, exit);
  return <AbsoluteFill style={{fontFamily: font, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: '50%', top: '46%', width: 1130, minHeight: 254, boxSizing: 'border-box', opacity: visibility, transform: `translate(-50%, -50%) scale(${0.97 + enter * 0.03})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '32px 48px 39px', background: `rgba(4,14,24,${project.chapterTransition.cardOpacity ?? 0.29})`, border: '5px solid #fff', boxShadow: '0 14px 36px #0006'}}>
      <div style={{color: '#fff', fontSize: 27, fontWeight: 900, letterSpacing: 5, textShadow: '0 3px 8px #000b'}}>{String(majorNumber).padStart(2, '0')}</div>
      <div style={{maxWidth: '100%', color: '#fff', fontSize: label.length > 9 ? 67 : 76, lineHeight: 1.17, fontWeight: 900, textAlign: 'center', textShadow: '0 4px 12px #000c'}}>{label}</div>
    </div>
  </AbsoluteFill>;
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

function EndRoll({scene, frame, duration, project}) {
  if (!scene.endRoll) return null;
  const {headline, finalSeconds, musicAsset, musicVolume = 0.075} = scene.endRoll;
  const finalFrames = framesFor(finalSeconds, project.fps);
  const finalStart = duration - finalFrames;
  const reveal = easeOut(between(frame, finalStart, finalStart + Math.round(0.6 * project.fps)));
  return <>
    {!project.endingSoundtrack && <Audio
      src={staticFile(project.assets[musicAsset].src)}
      loop
      volume={(audioFrame) => musicVolume * Math.min(1, audioFrame / project.fps) * Math.max(0, Math.min(1, (duration - audioFrame) / (2 * project.fps)))}
    />}
    {frame >= finalStart && <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill style={{background: 'rgba(4,8,12,.38)', opacity: reveal}} />
      <div style={{position: 'absolute', left: 78, right: 430, bottom: 82, color: '#fff', fontSize: 58, lineHeight: 1.25, fontWeight: 900, WebkitTextStroke: '4px #101820', paintOrder: 'stroke fill', textShadow: '0 6px 20px #000e', opacity: reveal, transform: `translateY(${Math.round((1 - reveal) * 18)}px)`}}>{headline}</div>
    </AbsoluteFill>}
  </>;
}

function ContinuousBackground({project, length}) {
  const playlist = project.backgroundPlaylist;
  if (!playlist) return null;
  const playlistLength = project.backgroundPlaylistEndAtSeconds === undefined
    ? length
    : Math.min(length, Math.round(project.backgroundPlaylistEndAtSeconds * project.fps));
  const segments = [];
  let start = 0;
  for (let index = 0; start < playlistLength; index++) {
    const clip = playlist[index % playlist.length];
    const duration = Math.min(playlistLength - start, Math.max(1, Math.floor(clip.durationSeconds * project.fps)));
    segments.push(<Sequence key={`${clip.asset}-${index}`} from={start} durationInFrames={duration}>
      <Video src={staticFile(project.assets[clip.asset].src)} trimBefore={Math.round((clip.trimStartSeconds ?? 0) * project.fps)} muted volume={0} objectFit="cover" style={{width: '100%', height: '100%', filter: 'brightness(1.08) contrast(1.03)'}} />
    </Sequence>);
    start += duration;
  }
  return <Sequence from={0} durationInFrames={playlistLength}>
    <AbsoluteFill>
    {segments}
    <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,8,12,.1), rgba(4,8,12,.02) 55%, rgba(4,8,12,.48))', pointerEvents: 'none'}} />
    </AbsoluteFill>
  </Sequence>;
}

function Scene({scene, project}) {
  const frame = useCurrentFrame();
  const duration = framesFor(sceneSeconds(scene, project), project.fps);
  const accent = project.theme?.accent ?? '#f6c84c';
  const narration = scene.narration?.asset ? project.assets[scene.narration.asset] : null;
  const edgeFade = scene.motion?.fadeEdges ? Math.max(1 - between(frame, 0, 8), between(frame, duration - 9, duration - 1)) : 0;
  const sceneBackground = !project.backgroundPlaylist || Boolean(scene.background || scene.backgroundCuts);
  const chapterIntroFrames = project.chapterTransition ? 0 : framesFor(project.chapterIntro?.durationSeconds ?? 0, project.fps);
  return (
    <AbsoluteFill style={{fontFamily: font, overflow: 'hidden', background: sceneBackground ? '#101820' : 'transparent'}}>
      {sceneBackground && (scene.backgroundCuts
        ? <BackgroundCuts scene={scene} project={project} frame={frame} duration={duration} />
        : <Background scene={scene} assets={project.assets} fps={project.fps} frame={frame} duration={duration} />)}
      {scene.chapterLabel && project.chapterPlacement !== 'top-left-fixed' && <div style={{position: 'absolute', top: 54, left: 66, padding: '11px 18px', background: 'rgba(8,16,24,.83)', borderLeft: `6px solid ${accent}`, color: '#fff', fontSize: 27, fontWeight: 900, boxShadow: '0 5px 16px #0007'}}>{scene.chapterLabel}</div>}
      {scene.inset && (!scene.chapterStart || frame >= chapterIntroFrames) && <ImageInset inset={scene.inset} assets={project.assets} frame={frame - (scene.chapterStart ? chapterIntroFrames : 0)} project={project} />}
      {(scene.insetSegments ?? []).map((inset, index) => {
        const from = Math.round(inset.atSeconds * project.fps);
        const length = Math.min(duration - from, Math.round(inset.durationSeconds * project.fps));
        return <Sequence key={`${inset.asset}-${index}`} from={from} durationInFrames={length}>
          <ImageInset inset={inset} assets={project.assets} frame={frame - from} project={project} />
        </Sequence>;
      })}
      {scene.overlays.map((item, index) => <Overlay key={`${item.type}-${index}`} item={item} accent={accent} frame={frame} duration={duration} animated={scene.motion?.textEntrance} index={index} avatar={scene.avatar} hasInset={Boolean(scene.inset || scene.insetSegments?.length)} opening={scene.id === 'opening-01'} />)}
      <EndRoll scene={scene} frame={frame} duration={duration} project={project} />
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
  let elapsed = 0;
  const silentTransitions = project.scenes.flatMap((scene) => {
    const start = elapsed;
    elapsed += framesFor(sceneSeconds(scene, project), project.fps);
    return scene.overlays.some((overlay) => overlay.type === 'transition') ? [{start, end: elapsed}] : [];
  });
  const musicVolume = soundtrack && ((frame) => {
    const fadeIn = (soundtrack.fadeInSeconds ?? 0) * project.fps;
    const fadeOut = (soundtrack.fadeOutSeconds ?? 0) * project.fps;
    const musicEnd = soundtrack.endAtSeconds === undefined
      ? length
      : Math.min(length, Math.round(soundtrack.endAtSeconds * project.fps));
    const start = fadeIn > 0 ? Math.min(1, frame / fadeIn) : 1;
    const end = fadeOut > 0 ? Math.min(1, (musicEnd - 1 - frame) / fadeOut) : frame < musicEnd ? 1 : 0;
    const transitionGain = soundtrack.muteDuringTransitions
      ? silentTransitions.reduce((gain, range) => {
        const ramp = Math.max(1, Math.round(project.fps * 0.15));
        if (frame >= range.start && frame < range.end) return 0;
        if (frame < range.start && frame >= range.start - ramp) return Math.min(gain, (range.start - frame) / ramp);
        if (frame >= range.end && frame < range.end + ramp) return Math.min(gain, (frame - range.end) / ramp);
        return gain;
      }, 1)
      : 1;
    return (soundtrack.volume ?? 0.12) * Math.max(0, Math.min(start, end)) * transitionGain;
  });
  const endingSoundtrack = project.endingSoundtrack;
  const endingMusicStart = endingSoundtrack
    ? project.scenes.slice(0, project.scenes.findIndex((scene) => scene.id === endingSoundtrack.startSceneId))
      .reduce((sum, scene) => sum + framesFor(sceneSeconds(scene, project), project.fps), 0)
    : 0;
  const endingMusicVolume = endingSoundtrack && ((audioFrame) => {
    const fadeIn = (endingSoundtrack.fadeInSeconds ?? 0) * project.fps;
    const fadeOut = (endingSoundtrack.fadeOutSeconds ?? 0) * project.fps;
    const duration = length - endingMusicStart;
    const enter = fadeIn > 0 ? Math.min(1, audioFrame / fadeIn) : 1;
    const exit = fadeOut > 0 ? Math.min(1, (duration - 1 - audioFrame) / fadeOut) : 1;
    return (endingSoundtrack.volume ?? 0.12) * Math.max(0, Math.min(enter, exit));
  });
  return (
    <AbsoluteFill style={{background: '#101820'}}>
      <ContinuousBackground project={project} length={length} />
      {soundtrack && <Audio src={staticFile(project.assets[soundtrack.asset].src)} loop={soundtrack.loop ?? true} volume={musicVolume} />}
      {endingSoundtrack && <Sequence from={endingMusicStart} durationInFrames={length - endingMusicStart}>
        <Audio src={staticFile(project.assets[endingSoundtrack.asset].src)} loop={endingSoundtrack.loop ?? true} volume={endingMusicVolume} />
      </Sequence>}
      <Series>
        {project.scenes.map((scene) => (
          <Series.Sequence key={scene.id} durationInFrames={framesFor(sceneSeconds(scene, project), project.fps)} name={scene.id}>
            <Scene scene={scene} project={project} />
          </Series.Sequence>
        ))}
      </Series>
      <ChapterIntro project={project} />
      <ChapterTransition project={project} />
      {project.persona && <PersistentAvatar project={project} />}
      {project.chapterPlacement === 'top-left-fixed' && <PersistentChapter project={project} />}
      <AbsoluteFill style={{backgroundColor: '#050607', opacity: between(frame, length - Math.round(project.fps * 0.65), length - 1), pointerEvents: 'none'}} />
    </AbsoluteFill>
  );
}
