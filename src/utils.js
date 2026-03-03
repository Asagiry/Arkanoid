export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const randomIn = (min, max) => Math.random() * (max - min) + min;

export const weightedPick = (items, getWeight) => {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  if (total <= 0) {
    return items[0];
  }
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= getWeight(item);
    if (roll <= 0) {
      return item;
    }
  }
  return items[items.length - 1];
};
