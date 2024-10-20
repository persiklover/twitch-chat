import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import parseTags from './utils/parse-tags';
import shortenLinks from './utils/shorten-links';
import StreamerIcon from './icons/StreamerIcon';
import ModeratorIcon from './icons/ModeratorIcon';
import SubscriberIcon from './icons/SubscriberIcon';
import ViewerIcon from './icons/ViewerIcon';
import messageMock from './message-mock';
import classNames from 'classnames';

const highlightLinks = (input: string) => {
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
};

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

const dev = import.meta.env.MODE === 'development';
const channelName = 'Rua_Sato';

function App() {
  const [messages, setMessages] = useState<ParsedMessage[]>(() => dev
    ? [{ ...messageMock, messageId: Math.random() } as unknown as ParsedMessage]
    : []
  );

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

       // Пример сообщения CLEARMSG
      const clearMsgRegex = /^@(.+?) :tmi\.twitch\.tv CLEARMSG #\w+ :(.+)$/;
      const matchClearMsg = message.match(clearMsgRegex);

      if (matchClearMsg) {
        const tags = parseTags(matchClearMsg[1]);
        const targetMessageId = tags['target-msg-id']; // Получаем ID сообщения для удаления

        if (targetMessageId) {
          // Удаляем сообщение с соответствующим messageId
          removeMessage(targetMessageId);
        }

        return null; // Возвращаем null, так как это служебное сообщение
      }

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
  }, []);

  // Функция удаления сообщений
  const removeMessage = (messageId: string) => {
    setMessages((prevMessages) => prevMessages.filter((msg) => msg.messageId !== messageId));
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Скроллим к последнему сообщению
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const MAX_MESSAGES = 10;
  useEffect(() => {
    if (messages.length > MAX_MESSAGES) {
      setMessages([...messages].slice(-MAX_MESSAGES));
    }
  }, [messages]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Спам сообщениями
  useEffect(() => {
    if (!dev) {
      return;
    }

    const interval = setInterval(() => {
      setMessages(messages => [...messages, {
        ...messageMock,
        content: 'test абоба '.repeat(8) + Math.random(),
        messageId: Math.random()
      } as unknown as ParsedMessage]);
    }, 2_000);

    return () => {
      clearInterval(interval);
    }
  }, []);

  return (
    <div
      ref={chatContainerRef}
      className={classNames(dev && 'bg-slate-600', 'flex flex-col')}
    >
      {messages.map(({ messageId, tags, username, content, isMod, isSub }, index) =>
        <div
          key={messageId}
          id={`message-${index}`}
          data-message-id={messageId}
          className="text-white w-full flex gap-3 p-2 rounded-xl"
        >
          {/* Profile Icon */}
          <div className="flex flex-col gap-1 items-center">
            <div className="flex justify-center items-center size-6 bg-[#ABBFF1] rounded-full">
              {username === channelName
                ? <StreamerIcon />
                : isMod
                  ? <ModeratorIcon />
                  : isSub
                    ? <SubscriberIcon />
                    : <ViewerIcon />
              }
            </div>
            {/* <div
              className="grow h-8 border-l-[2px] border-dashed border-[#ABBFF1]"
              style={{
                borderImage:
                'repeating-linear-gradient(#ABBFF1, #ABBFF1 18px, transparent 18px, transparent 24px, #ABBFF1 24px, #ABBFF1 24px) 1 100%' }}></div> */}
          </div>

          {/* Message Content */}
          <div className="flex flex-col gap-1 grow">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={classNames(
                  'ml-1 font-bold text-xl leading-tight',
                  username === channelName && 'text-blue-200'
                )}
                style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
              >
                {tags['display-name'] || username}
                {username === channelName && ' (чикибульони)'}
              </span>
            </div>
            <div
              className="relative max-w-96 bg-[#243171] py-2 px-4 rounded-lg border border-[#ABBFF1]"
              style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
            >
              <p className="block overflow-hidden text-ellipsis text-xl">
                {highlightLinks(content)}
              </p>
              <div className='absolute right-2 top-0 bottom-0 flex w-[1px] bg-[#ABBFF1]'></div>
            </div>
          </div>
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  )
}

export default App