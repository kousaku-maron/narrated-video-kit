import {displayText} from './text.js';
import {spokenSaleValues} from './spoken-prices.js';

export const yen = (value) => `￥${value.toLocaleString('ja-JP')}`;
export const saleAnnouncement = (price) => `今は${price.discountPercent}%OFF、${price.currentYen.toLocaleString('ja-JP')}円で遊べるぞ`;

const integer = (value) => Number.isSafeInteger(value) && value >= 0;
const compact = (value) => displayText(value).replace(/[\s,，]/gu, '');

export function validatePrice(price) {
  if (!price || !['sale', 'regular', 'unreleased', 'unknown'].includes(price.status)) {
    throw new Error('price.status must be sale, regular, unreleased, or unknown');
  }
  if (price.status === 'unreleased' || price.status === 'unknown') {
    if (['regularYen', 'currentYen', 'discountPercent'].some((key) => price[key] !== undefined)) {
      throw new Error('Unreleased/unknown price must not contain amounts or discounts');
    }
    return;
  }
  if (price.region !== 'JP' || !/^https:\/\/store\.steampowered\.com\/app\/\d+(?:\/|\?|$)/u.test(price.sourceUrl ?? '') ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u.test(price.verifiedAt ?? '') ||
      !Number.isFinite(Date.parse(price.verifiedAt))) {
    throw new Error('Known price needs JP region, official Steam app sourceUrl, and verifiedAt with timezone');
  }
  if (!integer(price.currentYen)) throw new Error('price.currentYen must be nonnegative integer yen');
  if (price.status === 'regular') {
    if (price.discountPercent !== undefined && price.discountPercent !== 0) throw new Error('Regular price cannot claim a discount');
    if (price.regularYen !== undefined && price.regularYen !== price.currentYen) throw new Error('Regular price amounts must agree');
    return;
  }
  if (!integer(price.regularYen) || price.regularYen <= price.currentYen ||
      !Number.isInteger(price.discountPercent) || price.discountPercent < 1 || price.discountPercent > 100) {
    throw new Error('Sale price needs regularYen > currentYen and discountPercent 1–100');
  }
  // Steam rounds the payable yen; allow one yen without accepting a different offer.
  if (Math.abs(price.currentYen - price.regularYen * (100 - price.discountPercent) / 100) > 1) {
    throw new Error('Sale amounts and discountPercent disagree');
  }
}

export function priceParts(price) {
  if (price.status === 'unreleased') return {current: '未発売'};
  if (price.status === 'unknown') return {current: '価格不明'};
  if (price.status === 'regular') return {current: yen(price.currentYen)};
  return {regular: yen(price.regularYen), current: yen(price.currentYen), discount: `（${price.discountPercent}%OFF）`};
}

export function validatePriceLabel(overlay, scene, project) {
  validatePrice(overlay.price);
  if (['meta', 'discount'].some((key) => overlay[key] !== undefined)) {
    throw new Error('Structured price cannot be combined with meta/discount text');
  }
  if (overlay.announcePrice !== undefined && typeof overlay.announcePrice !== 'boolean') {
    throw new Error('announcePrice must be boolean');
  }
  if (overlay.price.status !== 'sale' || overlay.announcePrice === false) return;
  const narration = scene.narration;
  const audio = narration?.asset && project.assets[narration.asset];
  const announcement = compact(saleAnnouncement(overlay.price));
  if (!narration?.text || !narration?.speechText || !compact(narration.text).includes(announcement)) {
    throw new Error('Sale introduction display text must contain the matching sale announcement');
  }
  const spoken = spokenSaleValues(narration.speechText);
  if (spoken?.currentYen !== overlay.price.currentYen || spoken?.discountPercent !== overlay.price.discountPercent) {
    throw new Error('Sale introduction spoken price/discount must match the displayed price; check speechText readings');
  }
  if (audio?.narrationText !== narration.text || audio?.speechText !== narration.speechText) {
    throw new Error('Sale narration audio metadata must match text and speechText; regenerate the WAV');
  }
  if (!/^[a-f0-9]{64}$/.test(audio.sha256 ?? '')) throw new Error('Sale narration needs the generated WAV sha256');
}
