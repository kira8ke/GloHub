/**
 * dialogue.js
 * 
 * Centralized avatar and character dialogue definitions.
 * - 10 avatars with names, images, and introduction messages
 * - 1 main lead character with 15 welcome messages
 * - Support for {name} placeholder replacement
 * 
 * Usage:
 *   import { avatars, leadCharacter, getRandomIntro, getRandomWelcome, interpolate } from './dialogue.js'
 *   const intro = interpolate(getRandomIntro('avatar1'), { name: 'Alice' })
 */

export const avatars = {
  avatar1: {
    id: 'avatar1',
    name: 'Starlight',
    image: 'assets/Yellow Standing Character.png',
    intros: [
      'Hey {name}! Ready to shine?',
      'Welcome, {name}! Let\'s light it up!',
      '{name}, it\'s time to sparkle and shine!',
      'Oh, {name}! So glad you\'re here!',
      'Hey superstar {name}, let\'s go!',
      'Welcome aboard, {name}! Time for adventure!',
      '{name}, are you ready for some fun?',
      'Hi {name}! Let\'s make this amazing!',
      '{name}, your moment is here!',
      'Welcome to the show, {name}!'
    ]
  },
  avatar2: {
    id: 'avatar2',
    name: 'Comet',
    image: 'assets/Black_Standing_Character.png',
    intros: [
      '{name}, let\'s blaze through this!',
      'Hey {name}! Time to make waves!',
      'Welcome, {name}! Speed ahead!',
      '{name}, buckle up for adventure!',
      'Hello {name}! Let\'s get moving!',
      '{name}, fast and furious—that\'s us!',
      'Hey {name}! Ready to zoom?',
      'Welcome, {name}! No time to waste!',
      '{name}, let\'s leave a trail!',
      'Hey superfast {name}, let\'s go!'
    ]
  },
  avatar3: {
    id: 'avatar3',
    name: 'Nova',
    image: 'assets/Hero Section Character.png',
    intros: [
      '{name}, you\'re a true hero!',
      'Welcome, {name}! Let\'s save the day!',
      '{name}, it\'s hero time!',
      'Hey {name}! Ready for greatness?',
      'Welcome, champion {name}!',
      '{name}, let\'s show them what we\'ve got!',
      'Hi {name}! Time to be legendary!',
      '{name}, heroes never give up!',
      'Welcome aboard, hero {name}!',
      '{name}, this is your moment to shine!'
    ]
  },
  avatar4: {
    id: 'avatar4',
    name: 'Aurora',
    image: 'assets/Dark Green Standing Character.png',
    intros: [
      '{name}, welcome to nature\'s magic!',
      'Hey {name}! Let\'s explore together!',
      'Welcome, {name}! Nature awaits!',
      '{name}, the adventure begins!',
      'Hi {name}! Ready for some mystery?',
      '{name}, let\'s discover together!',
      'Welcome, {name}! The world is ours!',
      '{name}, beauty is everywhere!',
      'Hey {name}! Let\'s find our path!',
      '{name}, welcome to the journey!'
    ]
  },
  avatar5: {
    id: 'avatar5',
    name: 'Pixel',
    image: 'assets/avatar5.png',
    intros: [
      '{name}, let\'s code some fun!',
      'Welcome, {name}! Tech time!',
      '{name}, ready to compute?',
      'Hey {name}! Let\'s level up!',
      'Welcome, {name}! Game on!',
      '{name}, digital adventure awaits!',
      'Hi {name}! Let\'s go digital!',
      '{name}, pixels and possibilities!',
      'Welcome, {name}! Let\'s create!',
      '{name}, the matrix awaits!'
    ]
  },
  avatar6: {
    id: 'avatar6',
    name: 'Blossom',
    image: 'assets/Baby Pink Standing Character.png',
    intros: [
      '{name}, let\'s bloom together!',
      'Welcome, {name}! So happy to see you!',
      '{name}, you\'re beautiful!',
      'Hey {name}! Let\'s grow!',
      'Welcome, {name}! Spreading joy!',
      '{name}, let\'s be kind and strong!',
      'Hi {name}! Kindness wins!',
      '{name}, you\'re amazing!',
      'Welcome, {name}! Life is beautiful!',
      '{name}, let\'s lift each other up!'
    ]
  },
  avatar7: {
    id: 'avatar7',
    name: 'Orbit',
    image: 'assets/Red Standing Character.png',
    intros: [
      '{name}, let\'s spin into action!',
      'Welcome, {name}! Energy unleashed!',
      '{name}, ready to rotate?',
      'Hey {name}! Let\'s go round and round!',
      'Welcome, {name}! Full power ahead!',
      '{name}, let\'s make it happen!',
      'Hi {name}! Momentum is key!',
      '{name}, we\'re unstoppable!',
      'Welcome, {name}! Time to orbit!',
      '{name}, let\'s keep the energy up!'
    ]
  },
  avatar8: {
    id: 'avatar8',
    name: 'Glint',
    image: 'assets/avatar8.png',
    intros: [
      '{name}, ready to sparkle?',
      'Welcome, {name}! Let\'s glimmer!',
      '{name}, you\'re precious!',
      'Hey {name}! Shine bright!',
      'Welcome, {name}! Reflection time!',
      '{name}, let\'s be brilliant!',
      'Hi {name}! Gleam and dream!',
      '{name}, golden moments ahead!',
      'Welcome, {name}! You glitter!',
      '{name}, let\'s shimmer and shine!'
    ]
  },
  avatar9: {
    id: 'avatar9',
    name: 'Echo',
    image: 'assets/Purple Standing Character.png',
    intros: [
      '{name}, your voice matters!',
      'Welcome, {name}! Let\'s echo your truth!',
      '{name}, speak up!',
      'Hey {name}! Listen closely!',
      'Welcome, {name}! Reverberating energy!',
      '{name}, let\'s be heard!',
      'Hi {name}! Your message is loud!',
      '{name}, amplify your power!',
      'Welcome, {name}! Repeat after me!',
      '{name}, let\'s make some noise!'
    ]
  },
  avatar10: {
    id: 'avatar10',
    name: 'Luna',
    image: 'assets/Cyan Standing Character (2).png',
    intros: [
      '{name}, moonlight shines on you!',
      'Welcome, {name}! Dreamy vibes!',
      '{name}, wish upon a star!',
      'Hey {name}! Nighttime adventure!',
      'Welcome, {name}! Mystical journey!',
      '{name}, let\'s chase the moon!',
      'Hi {name}! Celestial magic!',
      '{name}, under the stars we go!',
      'Welcome, {name}! Cosmic connection!',
      '{name}, let\'s float together!'
    ]
  }
};

/**
 * Main lead character (the one who greets the user)
 */
export const leadCharacter = {
  name: 'Guide',
  welcomeMessages: [
    'Hey {name}, welcome to the adventure!',
    '{name}, so glad you\'re here! Let\'s get started!',
    'Welcome aboard, {name}! This is going to be fun!',
    '{name}, your journey begins now!',
    'Hello {name}! Ready to explore?',
    '{name}, amazing things await!',
    'Welcome, {name}! Let\'s make memories!',
    '{name}, buckle up for the ride!',
    'Hey {name}! Today is your day!',
    '{name}, let\'s show the world what we\'ve got!',
    'Welcome, {name}! Time for magic!',
    '{name}, you\'ve got this!',
    'Hello {name}! Let\'s have a blast!',
    '{name}, this is just the beginning!',
    'Welcome, {name}! Let\'s change everything!'
  ]
};

/**
 * Get a random intro message for an avatar
 * @param {string} avatarId - The avatar ID (e.g., 'avatar1')
 * @returns {string} A random intro message from that avatar
 */
export function getRandomIntro(avatarId) {
  const avatar = avatars[avatarId];
  if (!avatar) return 'Welcome to the adventure!';
  const intros = avatar.intros || [];
  return intros[Math.floor(Math.random() * intros.length)] || 'Welcome!';
}

/**
 * Get a random welcome message from the lead character
 * @returns {string} A random welcome message
 */
export function getRandomWelcome() {
  const msgs = leadCharacter.welcomeMessages || [];
  return msgs[Math.floor(Math.random() * msgs.length)] || 'Welcome!';
}

/**
 * Interpolate {name} and other placeholders in a string
 * @param {string} text - The template text (e.g., "Hello {name}!")
 * @param {Object} data - Key-value pairs for placeholder replacement
 * @returns {string} Interpolated text
 */
export function interpolate(text, data = {}) {
  let result = text;
  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{${key}}`;
    result = result.split(placeholder).join(String(value));
  }
  return result;
}

/**
 * Get avatar by ID
 * @param {string} avatarId
 * @returns {Object|null}
 */
export function getAvatar(avatarId) {
  return avatars[avatarId] || null;
}

/**
 * Get all avatar IDs (useful for loops or validation)
 * @returns {Array<string>}
 */
export function getAllAvatarIds() {
  return Object.keys(avatars);
}
