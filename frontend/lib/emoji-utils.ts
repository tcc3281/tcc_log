/**
 * Emoji utilities for handling emoji conversions
 * This is a wrapper around emoji-toolkit to handle API changes between versions
 */

import * as emojiToolkit from 'emoji-toolkit';

/**
 * Convert shortname emojis like :smile: to Unicode emoji characters
 */
export function shortnameToUnicode(text: string): string {
  if (!text) return '';
  
  try {
    // Try different API versions of emoji-toolkit
    if (typeof emojiToolkit.shortnameToUnicode === 'function') {
      return emojiToolkit.shortnameToUnicode(text);
    } else if (
      emojiToolkit.joypixels && 
      typeof emojiToolkit.joypixels.shortnameToUnicode === 'function'
    ) {
      return emojiToolkit.joypixels.shortnameToUnicode(text);
    } 
    // Fall back to a simple regex-based replacement for common emojis
    else {
      // Basic emoji mapping for common emojis as fallback
      const emojiMap: Record<string, string> = {
        ':smile:': '😊',
        ':laughing:': '😂',
        ':grinning:': '😀',
        ':smiley:': '😃',
        ':blush:': '😊',
        ':wink:': '😉',
        ':heart:': '❤️',
        ':check:': '✅',
        ':white_check_mark:': '✅',
        ':x:': '❌',
        ':bulb:': '💡',
        ':warning:': '⚠️',
        ':memo:': '📝',
        ':book:': '📚',
        ':thumbsup:': '👍',
        ':thumbsdown:': '👎',
        ':star:': '⭐',
        ':fire:': '🔥',
        ':eyes:': '👀',
        ':tada:': '🎉'
      };
      
      return text.replace(/:([\w+-]+):/g, (match) => {
        return emojiMap[match] || match;
      });
    }
  } catch (error) {
    console.warn('Error converting emoji shortnames to unicode:', error);
    return text; // Return original text if conversion fails
  }
}

/**
 * Convert Unicode emoji characters to shortnames like :smile:
 */
export function unicodeToShortname(text: string): string {
  if (!text) return '';
  
  try {
    // Try different API versions
    if (typeof emojiToolkit.toShort === 'function') {
      return emojiToolkit.toShort(text);
    } else if (
      emojiToolkit.joypixels && 
      typeof emojiToolkit.joypixels.toShort === 'function'
    ) {
      return emojiToolkit.joypixels.toShort(text);
    }
    // No fallback implementation for this direction
    return text;
  } catch (error) {
    console.warn('Error converting unicode to emoji shortnames:', error);
    return text;
  }
}

/**
 * Check if emoji-toolkit is properly initialized
 */
export function isEmojiToolkitAvailable(): boolean {
  return !!(
    typeof emojiToolkit.shortnameToUnicode === 'function' || 
    (emojiToolkit.joypixels && typeof emojiToolkit.joypixels.shortnameToUnicode === 'function')
  );
}

/**
 * Get shortname for emoji character
 */
export function getShortname(emoji: string): string {
  if (!emoji) return '';
  
  try {
    // Try different API versions
    if (typeof emojiToolkit.toShort === 'function') {
      return emojiToolkit.toShort(emoji).replace(/:/g, '');
    } else if (
      emojiToolkit.joypixels && 
      typeof emojiToolkit.joypixels.toShort === 'function'
    ) {
      return emojiToolkit.joypixels.toShort(emoji).replace(/:/g, '');
    }
    // Basic reverse lookup for common emojis
    const emojiReverseMap: Record<string, string> = {
      '😊': 'smile',
      '😂': 'joy',
      '❤️': 'heart',
      '✅': 'check',
      '❌': 'x',
      '💡': 'bulb',
      '⚠️': 'warning',
      '📝': 'memo'
    };
    return emojiReverseMap[emoji] || 'emoji';
  } catch (error) {
    console.warn('Error getting emoji shortname:', error);
    return 'emoji';
  }
}

export default {
  shortnameToUnicode,
  unicodeToShortname,
  isEmojiToolkitAvailable,
  getShortname
};
