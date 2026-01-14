import type { CharacterId } from '../types';

/**
 * Character Quotes System
 * Yak-style quotes and taunts from cast members
 */

export interface CharacterQuote {
  text: string;
  context: 'success' | 'miss' | 'taunt' | 'wet' | 'save';
}

export const CHARACTER_QUOTES: Record<CharacterId, {
  success: string[];
  miss: string[];
  taunt: string[];
  wet: string[];
  save?: string[];
}> = {
  BIG_CAT: {
    success: [
      'LETS GO!',
      'THATS HOW YOU DO IT!',
      'CLEAN!',
      'BEAUTIFUL!',
    ],
    miss: [
      'NOT EVEN CLOSE!',
      'THAT WAS BAD!',
      'TRY AGAIN!',
      'NOPE!',
    ],
    taunt: [
      'YOU GOTTA BE KIDDING!',
      'THAT WAS ROUGH!',
      'COME ON NOW!',
    ],
    wet: [
      'WET RUN!',
      'THATS A WET ONE!',
      'OVER 75!',
    ],
    save: [
      'SAVED IT!',
      'NOT TODAY!',
      'BLOCKED!',
    ],
  },
  BRANDON_WALKER: {
    success: [
      'NICE SHOT!',
      'THATS IT!',
      'PERFECT!',
    ],
    miss: [
      'MISSED IT!',
      'NOT QUITE!',
      'ALMOST!',
    ],
    taunt: [
      'CLOSE BUT NO CIGAR!',
      'BETTER LUCK NEXT TIME!',
    ],
    wet: [
      'WET RUN!',
      'TOO SLOW!',
    ],
    save: [
      'DENIED!',
      'SAVED!',
    ],
  },
  KB: {
    success: [
      'BOOM!',
      'CRUSHED IT!',
      'THATS MONEY!',
    ],
    miss: [
      'WHIFF!',
      'MISSED!',
      'NOT THIS TIME!',
    ],
    taunt: [
      'GOTTA DO BETTER!',
      'THAT WAS WEAK!',
    ],
    wet: [
      'WET!',
      'OVER TIME!',
    ],
    save: [
      'BLOCKED!',
      'NO GOAL!',
    ],
  },
  NICK_TURANI: {
    success: [
      'LETS GO!',
      'THATS HOW ITS DONE!',
      'PERFECT!',
    ],
    miss: [
      'MISS!',
      'TRY AGAIN!',
      'NOT QUITE!',
    ],
    taunt: [
      'COME ON!',
      'YOU CAN DO BETTER!',
    ],
    wet: [
      'WET RUN!',
      'TOO SLOW!',
    ],
    save: [
      'SAVED!',
      'BLOCKED!',
    ],
  },
  KATE: {
    success: [
      'YES!',
      'THATS IT!',
      'PERFECT SHOT!',
    ],
    miss: [
      'MISSED!',
      'NOT QUITE!',
      'ALMOST!',
    ],
    taunt: [
      'GOTTA BE BETTER!',
      'THAT WAS CLOSE!',
    ],
    wet: [
      'WET!',
      'TOO SLOW!',
    ],
    save: [
      'SAVED!',
      'DENIED!',
    ],
  },
  ZAH: {
    success: [
      'NICE!',
      'THATS HOW YOU DO IT!',
      'CLEAN!',
    ],
    miss: [
      'MISS!',
      'NOT EVEN CLOSE!',
      'TRY AGAIN!',
    ],
    taunt: [
      'COME ON NOW!',
      'BETTER LUCK NEXT TIME!',
    ],
    wet: [
      'WET RUN!',
      'OVER 75!',
    ],
    save: [
      'BLOCKED!',
      'SAVED!',
    ],
  },
  STEVEN_CHEAH: {
    success: [
      'LETS GO!',
      'THATS IT!',
      'PERFECT!',
    ],
    miss: [
      'MISSED!',
      'NOT QUITE!',
      'ALMOST!',
    ],
    taunt: [
      'GOTTA DO BETTER!',
      'THAT WAS ROUGH!',
    ],
    wet: [
      'WET!',
      'TOO SLOW!',
    ],
    save: [
      'SAVED!',
      'BLOCKED!',
    ],
  },
  DANNY_CONRAD: {
    success: [
      'BOOM!',
      'THATS MONEY!',
      'CLEAN!',
    ],
    miss: [
      'MISS!',
      'NOT THIS TIME!',
      'TRY AGAIN!',
    ],
    taunt: [
      'COME ON!',
      'BETTER LUCK!',
    ],
    wet: [
      'WET RUN!',
      'OVER TIME!',
    ],
    save: [
      'DENIED!',
      'SAVED!',
    ],
  },
  MARK_TITUS: {
    success: [
      'LETS GO!',
      'THATS HOW YOU DO IT!',
      'PERFECT!',
    ],
    miss: [
      'MISSED!',
      'NOT QUITE!',
      'ALMOST!',
    ],
    taunt: [
      'GOTTA BE BETTER!',
      'THAT WAS CLOSE!',
    ],
    wet: [
      'WET!',
      'TOO SLOW!',
    ],
    save: [
      'BLOCKED!',
      'SAVED!',
    ],
  },
  TJ: {
    success: [
      'YES!',
      'THATS IT!',
      'NICE SHOT!',
    ],
    miss: [
      'MISS!',
      'NOT QUITE!',
      'TRY AGAIN!',
    ],
    taunt: [
      'COME ON NOW!',
      'BETTER LUCK!',
    ],
    wet: [
      'WET RUN!',
      'OVER 75!',
    ],
    save: [
      'SAVED!',
      'BLOCKED!',
    ],
  },
};

/**
 * Get a random quote for a character and context
 */
export function getCharacterQuote(
  characterId: CharacterId,
  context: 'success' | 'miss' | 'taunt' | 'wet' | 'save'
): string {
  const quotes = CHARACTER_QUOTES[characterId];
  const quoteList = context === 'save' ? (quotes.save || quotes.taunt) : quotes[context];
  
  if (!quoteList || quoteList.length === 0) {
    return 'NICE!';
  }
  
  return quoteList[Math.floor(Math.random() * quoteList.length)];
}

/**
 * Get character display name
 */
export function getCharacterName(characterId: CharacterId): string {
  const names: Record<CharacterId, string> = {
    BIG_CAT: 'BIG CAT',
    BRANDON_WALKER: 'BRANDON',
    KB: 'KB',
    NICK_TURANI: 'NICK',
    KATE: 'KATE',
    ZAH: 'ZAH',
    STEVEN_CHEAH: 'STEVEN',
    DANNY_CONRAD: 'DANNY',
    MARK_TITUS: 'MARK',
    TJ: 'TJ',
  };
  return names[characterId] || characterId;
}
