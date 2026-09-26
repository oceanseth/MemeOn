import { humanize } from '../lib/humanize'
import { sharedCopy } from './shared'

/**
 * Every string the mint desk spells: live status lines, form labels, preview card copy, API prompt
 * fragments and the errors the hook surfaces when a request throws nothing better. Builders under
 * `lib/createMemeModel/` and `hooks/useCreateMemeScreen` read from here exclusively.
 */
export const createMemeCopy = {
  page: {
    title: 'Mint a meme',
    subtitle: 'Make it strange. The internet will decide what happens next.',
  },
  modes: {
    remix: 'Remix',
    generate: 'Generate image',
    video: 'Generate video',
    upload: 'Upload',
    giphy: 'From Giphy',
    url: 'From URL',
  },
  /** The live status line while a job runs; every long job gets the same elapsed counter. */
  busy: {
    resumingRender: 'Resuming a video render already in progress…',
    searchingGiphy: 'Searching Giphy…',
    resolvingPage: 'Finding the main image on that page…',
    /** Editing a Giphy still or a resolved page image. */
    editing: 'Remixing with Masky (uses your credits)…',
    remixImage: 'Remixing the art (uses your Masky credits)…',
    restyleVideo: 'Restyling the whole video (uses your Masky credits)…',
    editFrame: 'Applying your edit to the frame (uses your Masky credits)…',
    renderingRemix: 'Rendering video remix… hold the vibe.',
    startingVideo: 'Starting video render (usually 1–3 minutes, uses your Masky credits)…',
    renderingVideo: 'Rendering the video — hold the vibe.',
    generatingImage: 'Rendering your masterpiece (uses your Masky credits)…',
    animatingFrame: 'Animating the approved frame (uses your Masky credits)…',
    minting: 'Minting…',
    uploadingImage: 'Uploading image…',
    uploadingVideo: 'Uploading video…',
    extractingPoster: 'Grabbing the first frame for the card…',
  },
  /** What the alert says when the request threw nothing the user can read. */
  errors: {
    remixSourceMissing: 'source meme not found',
    notALink: 'That is not a link — paste a full https:// address.',
    renderFailed:
      "The video render didn't finish. Try again, or reopen this page if a job is still running.",
    giphySearchFailed: "GIPHY search didn't work. Try another word, or pick a category.",
    resolveFailed: "Couldn't find an image on that page. Check the link and try again.",
    editFailed: "That Masky edit didn't finish. Try again.",
    remixFailed: "That Masky remix didn't finish. Try again.",
    videoGenerationFailed: "That Masky video didn't finish. Try again.",
    generationFailed: "That Masky image didn't finish. Try again.",
    animationFailed: "That Masky animation didn't finish. Try again.",
    mintFailed: "The card didn't mint. Try again.",
    creditsExhausted: 'Not enough Masky credits.',
    uploadFailed: "That file didn't upload. Try a smaller file, or try again.",
    /** The storage PUT answered with a status the user then reads in the alert. */
    uploadRejected: (status: number) =>
      `That file didn't upload (${status}). Try a smaller file, or try again.`,
    /** The poller gave up; the job id lets support find the render on Masky. */
    stillRendering: (generationId: string) =>
      `Still rendering after 8 minutes. It may finish on Masky (job ${generationId}) — reopen this page to pick the render back up.`,
    lifetimeEnded: 'This mint session ended. Start the render again.',
  },
  form: {
    sourceGroup: 'Source',
    heading: {
      generate: 'Make a fresh image',
      video: 'Make a fresh video',
      remix: 'Remix a card that already works',
      upload: 'Bring your own art',
      giphy: 'Borrow something from GIPHY',
      url: 'Pull it in off the web',
    },
    description: 'Turn a small thought into a card people can own.',
    titleLabel: 'Title',
    titlePlaceholder: 'e.g. cursed capybara',
    titleHelp: (max: number) => `Up to ${max} characters — it has to fit the card banner.`,
    /** Same `TITLE_MAX` the title field already interpolates. */
    titleFooter: (max: number) =>
      `Title is ${max} characters max. You mint 100 shares to yourself.`,
    tagsLabel: 'Tags',
    tagsPlaceholder: 'animals, chaos',
    tagsHelp: (max: number) => `Up to ${max} tags, comma-separated — this is how people find it.`,
    promptLabel: 'Prompt',
    creditsNote: 'Uses your Masky credits',
    toMint: 'To mint:',
    sharesToYou: '100 shares to you',
    mint: 'Mint',
    success: {
      copied: 'Share link copied to your clipboard.',
      minted: 'Minted. Your card is live and the share link is ready.',
      heading: 'Minted. It is live.',
      body: 'All 100 shares are yours. Send the link — every reshare pushes the card up the tier ladder.',
      copyLink: 'Copy share link',
      copyFailed: 'Copy failed — try again',
      shareLink: 'Share link',
      openCard: 'Open the card',
    },
    copied: sharedCopy.copied,
  },
  generate: {
    promptPlaceholder: 'a capybara in a business suit ignoring a burning office, cinematic',
    promptHelp:
      'Describe the whole scene — subject, style, chaos level. Put exact text in "double quotes" and it appears in the image verbatim. Runs on your Masky credits.',
    renderVideo: 'Render the video',
    renderImage: 'Render the image',
  },
  giphy: {
    results: (count: number, query: string) => `${humanize(count)} GIPHY results for "${query}"`,
    emptySearch: (query: string) =>
      `Nothing for "${query}" — try a broader word or pick a category.`,
    idle: 'Pick a category or search to browse GIPHY.',
    categoryLabel: 'Category',
    browseCategories: 'Browse categories…',
    searchLabel: 'Search GIPHY',
    queryPlaceholder: 'keyboard cat',
    search: 'Search',
    poweredBy: 'Powered by GIPHY',
    selected: 'Selected:',
    authorLabel: (author: string) => ` (@${author})`,
    pickSuffix: '— mint it as-is (with GIPHY attribution) or remix it below.',
    optionalPrompt: 'Optional prompt — remix the gif with Masky (uses your credits)',
    remixPlaceholder: 'put everyone in medieval armor',
    remixWithMasky: 'Remix with Masky',
  },
  remix: {
    loadingSource: 'Loading the meme you are remixing…',
    remixing: 'Remixing',
    by: ' by ',
    outputLabel: 'Output',
    outputOptions: {
      image: 'New image (edit the art)',
      video: 'New video',
    },
    videoStyleLabel: 'Video remix style',
    videoStyleOptions: {
      edit: 'Precise edit (change something, then animate)',
      restyle: 'Restyle the whole video (transforms the look)',
    },
    promptLabelPrecise: 'What to change (runs on your Masky credits)',
    promptLabelEdit: 'Edit prompt (runs on your Masky credits)',
    placeholder: {
      editFrame: 'add a claude icon to the tshirt he is wearing',
      restyle: 'make the whole scene look like a vaporwave painting',
      image: 'same scene but everyone is a skeleton and it is raining',
    },
    remixVideo: 'Remix into video',
    remixImage: 'Remix image',
    approvalTitle: 'Edit applied — happy with this frame?',
    approvalBody:
      'Keep it, then animate it or run another edit — check the card preview before you spend render credits.',
    motionLabel: 'Motion (optional — how the animated clip should move)',
    motionPlaceholder: 'he sprays himself in the face with the hose, same scene, short loop',
    animateIt: 'Looks good — animate it',
    rerunEdit: 'Re-run the edit',
  },
  upload: {
    imageHelp: (maxMb: number) =>
      `PNG, JPG, GIF or WebP, max ${maxMb}MB. Optional for videos — we grab the first frame.`,
    videoHelp: (maxMb: number) =>
      `MP4, MOV or WebM, max ${maxMb}MB. Adding one makes it a video meme.`,
    imageLabel: 'Image',
    videoLabel: 'Video',
    /* the picker's own words. A native file input writes these itself, in the browser's locale
       and nobody's voice; `atoms/file-drop` takes them from here instead. */
    chooseImage: 'Choose an image',
    chooseVideo: 'Choose a video',
    dropHint: 'or drop one here',
  },
  url: {
    fieldLabel: 'Image or page URL',
    placeholder: 'https://…/meme.png',
    help: 'Paste a direct image link, or a giphy/imgur/reddit page — we grab the main image.',
    fetch: 'Fetch image',
    optionalPrompt: 'Optional prompt — run the image through Masky image-edit (uses your credits)',
    remixPlaceholder: "same image but it's 3am and everything is on fire",
    applyEdit: 'Apply AI edit',
  },
  preview: {
    heading: 'Live card preview',
    description: 'This is what lands in the marketplace.',
    placeholder: 'Your card lands here.',
    busyHold: 'The card stays here while the frame cooks.',
    yourMeme: 'your meme',
    videoA11y: 'Video preview',
    previewOf: (label: string) => `Preview of ${label}`,
    untitled: 'Untitled',
    freshlyMintedNote: 'freshly minted',
    freshlyMinted: (tierName: string) =>
      `${tierName} · ${createMemeCopy.preview.freshlyMintedNote}`,
    originFromAuthor: (provider: string, author: string) => `from ${provider} · @${author}`,
    originFrom: (provider: string) => `from ${provider}`,
    /* Preview card only: GIPHY display name, and a fresh card's zero stats and value. */
    giphyProvider: 'GIPHY',
    zeroStats: '0 · 0',
    zeroValue: '0',
    overCap: (kind: 'image' | 'video', sizeMb: number, capMb: number, advice: string) =>
      `that ${kind} is ${sizeMb}MB — the cap is ${capMb}MB, ${advice}`,
    overCapAdvice: {
      video: 'try a shorter clip',
      image: 'try a smaller file',
    },
    nextStep: {
      credits: 'Top up Masky credits, or switch to Upload and bring your own image.',
      tooLarge: 'Try a smaller file, or a shorter clip.',
    },
    mintHint: {
      title: 'add a title',
      artwork: 'add artwork',
      animate: 'animate the frame',
      video: 'finish the video',
    },
  },
  /** Prompt fragments sent to Masky — not shown verbatim, but spelled once here. */
  prompts: {
    keepIdentical: ', keep everything else identical',
    videoThumbnailSuffix: ' — single dramatic still frame, meme thumbnail',
    motionFromReference:
      'same video and motion as the source, with the change from the reference image applied',
    motionDefault: 'subtle natural motion true to the scene, same style, short loop',
    motionWithEdit: (edit: string) =>
      `same video and motion as the source, with the change from the reference image applied — ${edit}`,
  },
} as const
