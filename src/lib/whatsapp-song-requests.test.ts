import { describe, expect, it } from 'vitest';
import {
  buildYouTubeSearchUrl,
  extractYouTubeVideoId,
  trackFromYouTubeVideoId,
} from './whatsapp-song-requests';

describe('buildYouTubeSearchUrl', () => {
  it('builds an encoded public YouTube search URL without API access', () => {
    expect(buildYouTubeSearchUrl('Evidências Chitãozinho & Xororó')).toBe(
      'https://www.youtube.com/results?search_query=Evid%C3%AAncias%20Chit%C3%A3ozinho%20%26%20Xoror%C3%B3',
    );
  });

  it('trims and caps long queries', () => {
    const url = new URL(buildYouTubeSearchUrl(`  ${'a'.repeat(200)}  `));
    expect(url.searchParams.get('search_query')).toBe('a'.repeat(120));
  });
});

describe('extractYouTubeVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=abcdefghijk', 'abcdefghijk'],
    ['https://youtu.be/abcdefghijk?t=10', 'abcdefghijk'],
    ['https://youtube.com/shorts/abcdefghijk', 'abcdefghijk'],
    ['https://www.youtube.com/embed/abcdefghijk', 'abcdefghijk'],
    ['https://music.youtube.com/watch?v=abcdefghijk', 'abcdefghijk'],
  ])('extracts an ID from %s', (url, expected) => {
    expect(extractYouTubeVideoId(url)).toBe(expected);
  });

  it.each([
    'not a URL',
    'https://youtube.com.evil.example/watch?v=abcdefghijk',
    'https://evil.example/watch?v=abcdefghijk',
    'javascript:alert(1)',
    'https://youtube.com/playlist?list=PL123',
    'https://youtu.be/too-short',
  ])('rejects unsupported URL %s', (url) => {
    expect(extractYouTubeVideoId(url)).toBeNull();
  });
});

describe('trackFromYouTubeVideoId', () => {
  it('creates the queue track shape for a valid ID', () => {
    expect(trackFromYouTubeVideoId('abcdefghijk')).toMatchObject({
      id: 'abcdefghijk',
      videoId: 'abcdefghijk',
      channel: 'Pedido pelo WhatsApp',
    });
  });

  it('rejects invalid IDs', () => {
    expect(trackFromYouTubeVideoId('bad')).toBeNull();
  });
});
