export default function parseTags(tagString: string) {
  if (tagString.indexOf('=') === -1) {
    return {};
  }
  const tags: Record<string, string> = {};
  const tagPairs = tagString.split(';');
  tagPairs.forEach(tag => {
    const [key, value] = tag.split('=');
    tags[key] = value || '';
  });
  return tags;
}