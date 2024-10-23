import shortenLinks from './shorten-links';

export default function highlightLinks(input: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = input.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          className="text-blue-300"
          href={part}
          target="_blank"
          rel="noopener noreferrer"
        >
          {shortenLinks(part)}
        </a>
      );
    }
    else {
      return part;
    }
  });
}