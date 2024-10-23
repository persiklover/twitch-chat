// Регулярное выражение для поиска упоминаний вида @username
const mentionRegex = /@(\w+)/g;

// Функция для разбиения текста и оборачивания упоминаний в span
export default function highlightMentions(text: string) {
  const parts = text.split(mentionRegex);
  return parts.map((part, index) => {
    if (mentionRegex.test(`@${part}`)) {
      return (
        <span key={index} className="text-blue-500 font-bold">
          @{part}
        </span>
      );
    }
    return part;
  });
}