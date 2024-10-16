import parseTags from './parse-tags';

describe('parseTags', () => {
  test('обрабатывает пустую строку корректно', () => {
    const tagString = '';
    const expected = {};
    
    expect(parseTags(tagString)).toEqual(expected);
  });

  test('возвращает пустую строку для пустых значений', () => {
    const tagString = 'badge-info=;color=';
    const expected = {
      'badge-info': '',
      'color': '',
    };
    
    expect(parseTags(tagString)).toEqual(expected);
  });

  test('парсит теги с одним элементом', () => {
    const tagString = 'mod=1';
    const expected = {
      'mod': '1',
    };
    
    expect(parseTags(tagString)).toEqual(expected);
  });

  test('парсит теги с корректным значением', () => {
    const tagString = 'badge-info=subscriber/6;color=#1E90FF';
    const expected = {
      'badge-info': 'subscriber/6',
      'color': '#1E90FF',
    };
    
    expect(parseTags(tagString)).toEqual(expected);
  });

  test('парсит теги с несколькими элементами', () => {
    const tagString = 'mod=1;subscriber=0;turbo=0';
    const expected = {
      'mod': '1',
      'subscriber': '0',
      'turbo': '0',
    };
    
    expect(parseTags(tagString)).toEqual(expected);
  });
});
