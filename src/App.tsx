import { useCallback, useEffect, useRef, useState } from 'react'
import classNames from 'classnames';
import shortenLinks from './utils/shorten-links';
import parseTags from './utils/parse-tags';
import messageMock from './message-mock';
import StreamerIcon from './icons/StreamerIcon';
import ModeratorIcon from './icons/ModeratorIcon';
import SubscriberIcon from './icons/SubscriberIcon';
import ViewerIcon from './icons/ViewerIcon';

const mentionRegex = /(@\w+)/g;
const urlRegex = /(https?:\/\/[^\s]+)/g;

function processText(input: string) {
  const mentionAndUrlRegex = new RegExp(`${mentionRegex.source}|${urlRegex.source}`, 'g');
  const parts = input.split(mentionAndUrlRegex);

  return parts.map((part, index) => {
    if (mentionRegex.test(part)) {
      return (
        <span key={index} className="bg-blue-500 text-white rounded px-0.5 font-bold">
          {part}
        </span>
      );
    } else if (urlRegex.test(part)) {
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
    } else {
      return part;
    }
  });
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

const dev = false && import.meta.env.MODE === 'development';
const channelName = 'Rua_Sato';

function App() {
  const [messages, setMessages] = useState<ParsedMessage[]>([]);

  useEffect(() => {
    if (!dev) {
      return;
    }
    displayMessage({ ...messageMock, messageId: Math.random() } as unknown as ParsedMessage);
  }, []);

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

    // Обрабатываем ошибки
    socket.onerror = (error: Event): void => {
      console.error('WebSocket Error:', error);
    };

    // Закрываем соединение
    socket.onclose = (): void => {
      console.log(`Disconnected from Twitch IRC for channel: ${channelName}`);
    };
  }, []);

  const removeOverflowingMessages = useCallback(() => {
    if (!chatContainerRef.current) {
      return;
    }
    
    const chatElement = chatContainerRef.current;
    
    messages.forEach(({ messageId }, index) => {
      const messageElement = document.getElementById(`message-${index}`);
      if (!messageElement) {
        return;
      }
      // Получаем размеры и положение элемента относительно контейнера
      const messageRect = messageElement.getBoundingClientRect();
      const containerRect = chatElement.getBoundingClientRect();

      if (messageRect.bottom > containerRect.bottom) {
        console.log('Удаляем index:', index);
        // removeMessage(messageId);
        // return;
        // Добавляем класс для анимации
        messageElement.classList.add('slide-out');

        // Удаляем сообщение после завершения анимации
        messageElement.addEventListener('transitionend', () => {
          removeMessage(messageId);
        }, { once: true });
      }
    });
  }, [messages]);

  const lastMessageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const messageElement = lastMessageRef.current;
    if (messageElement) {
      messageElement.style.marginTop = `-${messageElement.offsetHeight}px`;

      setTimeout(() => {
        messageElement.style.transition = 'margin-top 0.5s ease';
        messageElement.style.marginTop = '0';

        messageElement.addEventListener('transitionend', () => {
          removeOverflowingMessages();
        }, { once: true });
      }, 100);
    }
  }, [messages, removeOverflowingMessages]);

  // Функция для отображения сообщения
  function displayMessage(message: ParsedMessage): void {
    if (dev) {
      // const { username, content, isSub } = message;
      // console.log(`[${username}]: ${content} ${isSub ? '[SUBSCRIBER]' : ''}`);
    }
    // Здесь можно добавить код для отображения сообщений в HTML-элементе, если нужно
    setMessages(messages => [message, ...messages]);
  }

  // Функция удаления сообщений
  const removeMessage = (messageId: string) => {
    setMessages((prevMessages) => prevMessages.filter((msg) => msg.messageId !== messageId));
  };

  const chatStartRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Скроллим к последнему сообщению
  const scrollToTop = () => {
    chatStartRef.current?.scrollIntoView();
  };

  // Скроллим к последнему сообщению
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToTop();
  }, [messages]);

  const MAX_MESSAGES = 10;
  useEffect(() => {
    if (messages.length > MAX_MESSAGES) {
      setMessages([...messages].slice(0, MAX_MESSAGES));
    }
  }, [messages]);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  /** Проверка, есть ли у элемента прокрутка */
  const hasScroll = (element: HTMLElement): boolean => {
    return element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;
  };

  // Спам сообщениями
  const countRef = useRef(1);
  const SPAM_INTERVAL = 2_000;
  useEffect(() => {
    if (!dev) {
      return;
    }

    const interval = setInterval(() => {
      displayMessage({
        ...messageMock,
        content: `@Rua_Sato ${countRef.current++}`.repeat(4),
        messageId: Math.random()
      } as unknown as ParsedMessage);
    }, SPAM_INTERVAL);

    return () => {
      clearInterval(interval);
    }
  }, [messages.length]);

  return (
    <div
      ref={chatContainerRef}
      id='chat'
      className={classNames(dev && 'bg-slate-600', 'flex flex-col h-screen')}
    >
      <div ref={chatStartRef} />
      {messages.map(({ messageId, tags, username, content, isMod, isSub }, index) => {
        const isStreamer = username === channelName.toLowerCase();
        const displayName = tags?.['display-name'] || username;
        const isHighlited = tags?.['msg-id'] === 'highlighted-message';
        return (
          <div
            key={messageId}
            ref={index === 0 ? lastMessageRef : undefined}
            id={`message-${index}`}
            className={classNames(
              'message',
              index === 0 && 'new-message',
              'text-white w-full flex gap-3 p-2 rounded-xl'
            )}
            data-message-id={messageId}
          >
            {/* Profile Icon */}
            <div className="flex flex-col gap-1 items-center">
              <div className="flex justify-center items-center size-6 bg-[#ABBFF1] rounded-full">
                {username === channelName.toLowerCase()
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
                    isStreamer && 'text-blue-200'
                  )}
                  style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
                >
                  {displayName}
                  {isStreamer && ' (чикибульони)'}
                </span>
              </div>
              <div
                className="relative max-w-96 bg-[#243171] py-2 px-4 rounded-lg border border-[#ABBFF1]"
                style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}
              >
                <p
                  className={classNames(
                    'block overflow-hidden text-ellipsis text-xl',
                    isHighlited && 'bg-blue-500 text-white'
                  )}
                  // dangerouslySetInnerHTML={{ __html: processText(content) }}
                >
                  {processText(content)}
                </p>
                <div className='absolute right-2 top-0 bottom-0 flex w-[1px] bg-[#ABBFF1]'></div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={chatEndRef} />
    </div>
  )
}

export default App