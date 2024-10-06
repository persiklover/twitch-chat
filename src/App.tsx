import { useEffect, useState } from 'react'

interface ParsedMessage {
  tags: { [key: string]: string };
  username: string;
  channel: string;
  content: string;
  isMod: boolean;
  isSub: boolean;
  userId: string;
  messageId: string;
}

const channelName = 'Rua_Sato';

function App() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  useEffect(() => {
    const username = `justinfan${Math.floor(Math.random() * 100000)}`;  // Гостевой аккаунт с случайным числом
    const channel = `#${channelName.toLowerCase()}`;  // Название канала (всегда в нижнем регистре и с '#')

    const socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

    // Открываем соединение
    socket.onopen = (): void => {
      console.log(`Connected to Twitch IRC for channel: ${channelName}`);
      // Запрашиваем IRC Capabilities, чтобы получать теги
      socket.send('CAP REQ :twitch.tv/tags');
      socket.send('CAP REQ :twitch.tv/commands');
      socket.send('CAP REQ :twitch.tv/membership');
      // Отправляем NICK и JOIN команды
      socket.send(`NICK ${username}`);
      socket.send(`JOIN ${channel}`);
    };

    // Обрабатываем входящие сообщения
    socket.onmessage = (event: MessageEvent): void => {
      const message = event.data.trim();

      // Фильтрация PING/PONG сообщений
      if (message.startsWith('PING')) {
        socket.send('PONG :tmi.twitch.tv');
        return;
      }

      // Логика обработки сообщений чата
      const parsedMessage = parseMessage(message);
      if (parsedMessage) {
        displayMessage(parsedMessage);
      }
    };

    function parseMessage(message: string): ParsedMessage | null {
      // IRC tags включаются в префикс сообщения и начинаются с '@'
      const tagRegex = /^@([^ ]+) :(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG (#\w+) :(.+)$/;
      const match = message.match(tagRegex);

      if (match) {
        const tags = parseTags(match[1]);
        const username = match[2];
        const channel = match[3];
        const content = match[4];

        return {
          tags,
          username,
          channel,
          content,
          isMod: tags['mod'] === '1',
          isSub: tags['subscriber'] === '1',
          userId: tags['user-id'] || '',
          messageId: tags['id'] || ''
        };
      }

      return null;
    }

    function parseTags(tagString: string): { [key: string]: string } {
      const tags: { [key: string]: string } = {};
      const tagPairs = tagString.split(';');

      tagPairs.forEach(tag => {
        const [key, value] = tag.split('=');
        tags[key] = value || '';
      });

      return tags;
    }

    // Функция для отображения сообщения
    function displayMessage(message: ParsedMessage): void {
      const { username, content } = message;
      console.log(`[${username}]: ${content}`);
      // Здесь можно добавить код для отображения сообщений в HTML-элементе, если нужно
      setMessages(messages => [...messages, message]);
    }

    // Обрабатываем ошибки
    socket.onerror = (error: Event): void => {
      console.error('WebSocket Error:', error);
    };

    // Закрываем соединение
    socket.onclose = (): void => {
      console.log(`Disconnected from Twitch IRC for channel: ${channelName}`);
    };
  }, [])

  return (
    <>
      <h1 className="text-3xl font-bold">
        Twitch chat for {channelName}:
      </h1>
      <ul>
        {messages.map(({ messageId, username, content }) =>
          <li key={messageId}>
            {username}: {content}
          </li>
        )}
      </ul>
    </>
  )
}

export default App