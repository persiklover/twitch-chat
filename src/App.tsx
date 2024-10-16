import { useEffect, useState } from 'react'
import parseTags from './utils/parse-tags';
import StreamerIcon from './icons/StreamerIcon';
import ModeratorIcon from './icons/ModeratorIcon';
import SubscriberIcon from './icons/SubscriberIcon';
import ViewerIcon from './icons/ViewerIcon';

function shortenLinks(input: string) {
  return input.replace(/https?:\/\/(www\.)?([\w.-]+\.[a-z]{2,6}\/[^\s]*)/gi, '$2');
}

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
  const [messages, setMessages] = useState<ParsedMessage[]>([
    {
      username: 'Бобик',
      content: 'Привет, Руа, мечтаю сорвать с тебя одержу и утонуть в твоих нежныхнежныхнежныхнежныхнежныхнежныхнежныхнежныхнежных boobs'
    } as ParsedMessage
  ]);
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
        console.log(parsedMessage);
        displayMessage(parsedMessage);
      }
    };

    function parseMessage(message: string): ParsedMessage | null {
      console.log(message);
      // IRC tags включаются в префикс сообщения и начинаются с '@'
      const tagRegex = /^@([^ ]+) :(\w+)!\w+@\w+\.tmi\.twitch\.tv PRIVMSG (#\w+) :(.+)$/;
      const match = message.match(tagRegex);

      if (match) {
        const tags = parseTags(match[1]);
        const username = match[2];
        const channel = match[3];
        const content = match[4];

        // Проверка на наличие значков подписчика через тег badges
        const badges = tags['badges'] || '';
        const isSub = tags['subscriber'] === '1';  // Если тег subscriber равен "1", пользователь подписчик
        const hasSubBadge = badges.includes('subscriber');  // Также проверяем значок подписчика

        return {
          tags,
          username,
          channel,
          content,
          isMod: tags['mod'] === '1',
          isSub: isSub || hasSubBadge,  // Проверка через тег subscriber или значок badges
          userId: tags['user-id'] || '',
          messageId: tags['id'] || ''
        };
      }

      return null;
    }

    // Функция для отображения сообщения
    function displayMessage(message: ParsedMessage): void {
      const { username, content, isSub } = message;
      console.log(`[${username}]: ${content} ${isSub ? '[SUBSCRIBER]' : ''}`);
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
    <div className="bg-slate-600 flex flex-col w-screen min-h-screen">
      <ul className='w-full flex flex-col'>
        {messages.map(({ messageId, username, content, isMod, isSub }) =>
          <div key={messageId || -1} className="text-white w-full flex gap-3 p-2 rounded-xl">
            {/* Profile Icon */}
            <div className="flex flex-col gap-1 items-center">
              <div className="flex justify-center items-center size-[22px] bg-[#ABBFF1] rounded-full">
                {username === channelName.toLowerCase()
                  ? <StreamerIcon />
                  : isMod
                    ? <ModeratorIcon />
                    : isSub
                      ? <SubscriberIcon />
                      : <ViewerIcon />
                }
              </div>
              <div
                className="grow h-8 border-l-[2px] border-dashed border-[#ABBFF1]"
                style={{
                  borderImage:
                  'repeating-linear-gradient(#ABBFF1, #ABBFF1 18px, transparent 18px, transparent 24px, #ABBFF1 24px, #ABBFF1 24px) 1 100%' }}></div>

            </div>

            {/* Message Content */}
            <div className="flex flex-col gap-1 grow">
              <div className="flex items-center gap-2 text-sm">
                <span className="ml-1 font-bold" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>{username}</span>
              </div>
              <div className="relative max-w-full bg-[#243771] py-2 px-4 rounded-lg border border-[#ABBFF1] shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {shortenLinks(content)}
                {/* <p className="block overflow-hidden text-ellipsis">{shortenLinks(content)}</p> */}
                <div className='absolute right-2 top-0 bottom-0 flex w-[1px] bg-[#ABBFF1]'></div>
              </div>
            </div>
          </div>
        )}
      </ul>
    </div>
  )
}

export default App