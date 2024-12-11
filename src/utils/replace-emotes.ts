import emotes from '../assets/twitch_emotes.json';

const regexp = new RegExp(`(${Object.keys(emotes).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');

export default function replaceEmotes(message: string): string {
  return message.replace(regexp, (match, emoteName: keyof typeof emotes) => {
    console.log(match);
    const emoteUrl = emotes[emoteName];
    if (emoteUrl) {
      return `<img src="${emoteUrl}" alt="${emoteName}" />`;
    }
    return match;
  });
}