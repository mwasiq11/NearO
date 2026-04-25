type ParsedAvailability = {
  tags: string[];
  quantity: number | null;
};

const normalizeQuantity = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return Math.floor(parsed);
};

export const parseAvailabilityMetadata = (rawAvailability: unknown): ParsedAvailability => {
  if (typeof rawAvailability !== 'string' || rawAvailability.trim().length === 0) {
    return { tags: [], quantity: null };
  }

  const trimmed = rawAvailability.trim();

  try {
    const parsed = JSON.parse(trimmed);
    const tags = Array.isArray(parsed?.tags)
      ? parsed.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean)
      : [];
    const quantity = normalizeQuantity(parsed?.quantity);

    return { tags, quantity };
  } catch {
    const tags = trimmed
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    return { tags, quantity: null };
  }
};

export const serializeAvailabilityMetadata = (tags: string[], quantity?: number | null): string => {
  const normalizedTags = tags.map((tag) => tag.trim()).filter(Boolean);
  const normalizedQuantity = normalizeQuantity(quantity);

  return JSON.stringify({
    tags: normalizedTags,
    quantity: normalizedQuantity,
  });
};
