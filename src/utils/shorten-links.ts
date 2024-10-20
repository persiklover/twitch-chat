export default function shortenLinks(input: string) {
  return input.replace(/https?:\/\/(www\.)?([\w.-]+\.[a-z]{2,6}\/[^\s]*)/gi, '$2');
}