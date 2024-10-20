import { describe, it, expect } from '@jest/globals';
import shortenLinks from './shorten-links';

describe('shortenLinks', () => {
  it('should shorten a link by removing the protocol and www', () => {
    const input = 'Check this link: https://www.example.com/some/path';
    const expected = 'Check this link: example.com/some/path';
    expect(shortenLinks(input)).toBe(expected);
  });

  it('should shorten multiple links in the input string', () => {
    const input = 'Links: https://www.example.com/some/path and http://test.com/another/path';
    const expected = 'Links: example.com/some/path and test.com/another/path';
    expect(shortenLinks(input)).toBe(expected);
  });

  it('should handle links without www', () => {
    const input = 'Visit https://example.com/path for more information';
    const expected = 'Visit example.com/path for more information';
    expect(shortenLinks(input)).toBe(expected);
  });

  it('should not change text without links', () => {
    const input = 'This is just a simple text without any links.';
    const expected = 'This is just a simple text without any links.';
    expect(shortenLinks(input)).toBe(expected);
  });

  it('should handle links with different protocols', () => {
    const input = 'Secure link: https://secure.com/path, non-secure: http://nonsecure.com/path';
    const expected = 'Secure link: secure.com/path, non-secure: nonsecure.com/path';
    expect(shortenLinks(input)).toBe(expected);
  });
});