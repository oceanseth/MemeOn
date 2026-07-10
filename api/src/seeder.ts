// Scheduled Giphy archive seeder (EventBridge → lambda with {action:"giphy-seed"}).
// Built for BREADTH: each run pulls the term-free trending feed plus ~40 terms
// from a ~600-word vocabulary (rotating window per hour), taking only a few
// gifs per term — wide coverage of giphy instead of depth in a narrow list.
import { randomUUID } from 'node:crypto'
import * as db from './db'
import { search, trending } from './giphy'
import { TIERS } from '../../shared/tiers'
import type { Meme } from './types'

const EMOTIONS = [
  'happy', 'sad', 'angry', 'excited', 'bored', 'confused', 'shocked', 'scared', 'nervous',
  'proud', 'jealous', 'embarrassed', 'annoyed', 'relieved', 'suspicious', 'smug', 'crying',
  'laughing', 'screaming', 'panic', 'chill', 'cozy', 'grumpy', 'dramatic', 'awkward', 'cringe',
  'disgusted', 'in love', 'heartbroken', 'unbothered', 'stressed', 'sleepy', 'hyped', 'salty',
]
const ANIMALS = [
  'cat', 'dog', 'puppy', 'kitten', 'hamster', 'capybara', 'raccoon', 'possum', 'owl', 'frog',
  'toad', 'axolotl', 'sloth', 'otter', 'red panda', 'penguin', 'duck', 'goose', 'chicken',
  'goat', 'alpaca', 'llama', 'horse', 'pig', 'cow', 'monkey', 'gorilla', 'bear', 'polar bear',
  'fox', 'wolf', 'lion', 'tiger', 'elephant', 'giraffe', 'hippo', 'seal', 'walrus', 'dolphin',
  'shark', 'octopus', 'crab', 'turtle', 'snake', 'lizard', 'parrot', 'pigeon', 'bat', 'bee',
]
const ACTIONS = [
  'dancing', 'running', 'jumping', 'falling', 'tripping', 'sliding', 'spinning', 'flexing',
  'waving', 'clapping', 'pointing', 'shrugging', 'nodding', 'headbanging', 'moonwalk',
  'backflip', 'yawning', 'sneezing', 'eating', 'cooking', 'baking', 'typing', 'coding',
  'gaming', 'studying', 'working out', 'lifting', 'yoga', 'swimming', 'surfing', 'skating',
  'skateboarding', 'biking', 'driving', 'singing', 'rapping', 'dj', 'guitar', 'piano',
  'drums', 'painting', 'cleaning', 'shopping', 'napping', 'hiding', 'sneaking', 'celebrating',
]
const REACTIONS = [
  'facepalm', 'eye roll', 'mind blown', 'jaw drop', 'thumbs up', 'thumbs down', 'high five',
  'fist bump', 'mic drop', 'slow clap', 'side eye', 'double take', 'nope', 'yes', 'no way',
  'oh no', 'oops', 'whatever', 'deal with it', 'bring it', 'come at me', 'i give up',
  'not impressed', 'chefs kiss', 'ok boomer', 'sure jan', 'awkward silence', 'popcorn',
  'grabbing popcorn', 'this is fine', 'why me', 'i cant even', 'over it', 'bye felicia',
]
const POP = [
  'star wars', 'marvel', 'batman', 'spiderman', 'harry potter', 'lord of the rings', 'anime',
  'pokemon', 'mario', 'zelda', 'minecraft', 'fortnite', 'the office', 'parks and rec',
  'friends tv', 'seinfeld', 'simpsons', 'family guy', 'rick and morty', 'spongebob', 'shrek',
  'disney', 'pixar', 'frozen', 'toy story', 'star trek', 'doctor who', 'stranger things',
  'game of thrones', 'breaking bad', 'better call saul', 'succession', 'the mandalorian',
  'barbie', 'oppenheimer', 'godzilla', 'king kong', 'jurassic park', 'terminator', 'matrix',
]
const LIFE = [
  'monday', 'friday', 'weekend', 'payday', 'taxes', 'deadline', 'meeting', 'zoom call',
  'email', 'boss', 'coworker', 'intern', 'promotion', 'retirement', 'coffee', 'espresso',
  'tea', 'pizza', 'tacos', 'burger', 'ramen', 'sushi', 'donut', 'ice cream', 'chocolate',
  'wine', 'beer', 'brunch', 'diet', 'gym', 'leg day', 'cardio', 'traffic', 'commute',
  'road trip', 'vacation', 'beach', 'camping', 'moving day', 'laundry', 'dishes', 'wifi down',
  'low battery', 'monday morning', 'sunday scaries', 'group project', 'homework', 'finals',
]
const INTERNET = [
  'meme', 'viral', 'trending', 'doge', 'grumpy cat', 'nyan cat', 'keyboard cat', 'rickroll',
  'stonks', 'to the moon', 'diamond hands', 'hodl', 'crypto', 'nft', 'ai', 'robot', 'glitch',
  'error 404', 'loading', 'buffering', 'lag', 'afk', 'gg', 'noob', 'speedrun', 'unboxing',
  'reaction', 'vibe check', 'main character', 'npc', 'sigma', 'rizz', 'sus', 'based', 'ratio',
  'touch grass', 'goblin mode', 'girl dinner', 'no thoughts', 'brain rot', 'doom scrolling',
]
const SPORTS_HOLIDAYS = [
  'football', 'soccer', 'basketball', 'baseball', 'hockey', 'tennis', 'golf', 'bowling',
  'darts', 'chess', 'poker', 'olympics', 'world cup', 'super bowl', 'touchdown', 'home run',
  'slam dunk', 'goal', 'knockout', 'victory', 'defeat', 'christmas', 'halloween',
  'thanksgiving', 'new year', 'birthday', 'wedding', 'graduation', 'valentines', 'st patricks',
  'easter', 'fourth of july', 'april fools', 'friday the 13th', 'full moon', 'eclipse',
]

const TERMS: string[] = [
  ...EMOTIONS, ...ANIMALS, ...ACTIONS, ...REACTIONS, ...POP, ...LIFE, ...INTERNET,
  ...SPORTS_HOLIDAYS,
].flatMap((t) => [t, `${t} meme`]) // each concept swept both raw and meme-flavored

const TERMS_PER_RUN = 40
const MAX_PER_TERM = 3
const DEFAULT_MAX_PER_RUN = 100
const DEFAULT_INVENTORY_TARGET = 400

export async function runGiphySeed(opts: {
  max?: number
  inventoryTarget?: number
}): Promise<{ seeded: number; inventory: number; skipped: boolean; termsSwept: number }> {
  const max = Math.min(opts.max ?? DEFAULT_MAX_PER_RUN, 200)
  const target = opts.inventoryTarget ?? DEFAULT_INVENTORY_TARGET

  await db.ensureUser({ sub: db.ARCHIVE_SUB, name: 'Meme Archive', picture: null })
  // counter + per-gif markers instead of scanning memes: correct at any scale
  const alreadySeeded = await db.archiveSeedCount()
  if (alreadySeeded >= target) {
    return { seeded: 0, inventory: alreadySeeded, skipped: true, termsSwept: 0 }
  }
  const room = Math.min(max, target - alreadySeeded)

  let seeded = 0
  const mintGif = async (
    gif: Awaited<ReturnType<typeof search>>[number],
    tag: string,
  ): Promise<boolean> => {
    if (!gif.mp4Url) return false
    // permanent marker record — never mint the same gif twice, ever
    if (!(await db.markGiphySeeded(gif.id))) return false
    const meme: Meme = {
      id: randomUUID().slice(0, 12),
      title: gif.title.slice(0, 20) || 'Classic Meme',
      description: `From the Meme Archive · via GIPHY${gif.author ? ` (@${gif.author})` : ''}`,
      mediaType: 'video',
      imageUrl: gif.stillUrl,
      videoUrl: gif.mp4Url,
      tags: ['archive', tag.split(' ')[0]],
      creatorId: db.ARCHIVE_SUB,
      creatorName: 'Meme Archive',
      ownerId: db.ARCHIVE_SUB,
      ownerName: 'Meme Archive',
      reshares: 0,
      tierKey: TIERS[0].key,
      listing: null,
      createdAt: new Date().toISOString(),
      remixOf: null,
      private: false,
      source: { provider: 'giphy', id: gif.id, url: gif.url, author: gif.author },
    }
    await db.putMeme(meme)
    await db.putPosition(meme.id, db.ARCHIVE_SUB, 100)
    // archive stock goes straight on the market: 10 shares for 1 braincell
    await db.setListing(meme.id, { sellerId: db.ARCHIVE_SUB, pricePerShare: 0.1, shares: 100 })
    seeded++
    return true
  }

  // 1) term-free trending: whatever giphy is serving right now (rotating page)
  const runIndex = Math.floor(Date.now() / 3600_000)
  const trendingOffset = (runIndex * 50) % 500
  for (const gif of await trending(50, trendingOffset).catch(() => [])) {
    if (seeded >= room) break
    await mintGif(gif, 'trending')
  }

  // 2) breadth sweep: a fresh window of the vocabulary each run, few per term
  let termsSwept = 0
  for (let i = 0; i < TERMS_PER_RUN && seeded < room; i++) {
    const term = TERMS[(runIndex * TERMS_PER_RUN + i) % TERMS.length]
    termsSwept++
    const results = await search(term, 10).catch(() => [])
    let fromThisTerm = 0
    for (const gif of results) {
      if (seeded >= room || fromThisTerm >= MAX_PER_TERM) break
      if (await mintGif(gif, term)) fromThisTerm++
    }
  }

  if (seeded > 0) await db.bumpArchiveSeedCount(seeded)
  return { seeded, inventory: alreadySeeded + seeded, skipped: false, termsSwept }
}
