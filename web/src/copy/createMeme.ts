import { sharedCopy } from './shared'

/**
 * Every string the mint desk spells: live status lines, form labels, preview card copy, API prompt
 * fragments and the errors the hook surfaces when a request throws nothing better. Builders under
 * `lib/createMemeModel/` and `hooks/useCreateMemeScreen` read from here exclusively.
 */
export const createMemeCopy = {
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
    notALink: 'that is not a link — paste a full https:// address',
    renderFailed: 'render failed',
    giphySearchFailed: 'giphy search failed',
    resolveFailed: 'could not resolve that page',
    editFailed: 'edit failed',
    remixFailed: 'remix failed',
    videoGenerationFailed: 'video generation failed',
    generationFailed: 'generation failed',
    animationFailed: 'animation failed',
    mintFailed: 'mint failed',
    uploadFailed: 'upload failed',
    /** The storage PUT answered with a status the user then reads in the alert. */
    uploadRejected: (status: number) => `upload failed (${status})`,
    /** The poller gave up; the job id lets support find the render on Masky. */
    stillRendering: (generationId: string) =>
      `Still rendering after 8 minutes. It may finish on Masky (job ${generationId}) — reopen this page to pick the render back up.`,
    lifetimeEnded: 'creation lifetime ended',
  },
  form: {
    sourceGroup: 'Source',
    titlePlaceholder: 'e.g. cursed capybara',
    titleHelp: (max: number) => `Up to ${max} characters — it has to fit the card banner.`,
    tagsPlaceholder: 'animals, chaos',
    tagsHelp: (max: number) => `Up to ${max} tags, comma-separated — this is how people find it.`,
    success: {
      copied: 'Share link copied to your clipboard.',
      minted: 'Minted. Your card is live and the share link is ready.',
      heading: '🧠 Minted. It is live.',
      body: 'All 100 shares are yours. Send the link — every reshare pushes the card up the tier ladder.',
      copyLink: '🔗 Copy share link',
      shareLink: 'Share link',
    },
    copied: sharedCopy.copied,
  },
  generate: {
    promptPlaceholder: 'a capybara in a business suit ignoring a burning office, cinematic',
    promptHelp: 'Describe the whole scene — subject, style, chaos level. Runs on your Masky credits.',
    renderVideo: 'Render the video',
    renderImage: 'Render the image',
  },
  giphy: {
    results: (count: number, query: string) => `${count} GIPHY results for "${query}"`,
    emptySearch: (query: string) => `Nothing for "${query}" — try a broader word or pick a category.`,
    idle: 'Pick a category or search to browse GIPHY.',
  },
  remix: {
    loadingSource: 'Loading the meme you are remixing…',
    promptLabelPrecise: 'What to change (runs on your Masky credits)',
    promptLabelEdit: 'Edit prompt (runs on your Masky credits)',
    placeholder: {
      editFrame: 'add a claude icon to the tshirt he is wearing',
      restyle: 'make the whole scene look like a vaporwave painting',
      image: 'same scene but everyone is a skeleton and it is raining',
    },
    remixVideo: 'Remix into video',
    remixImage: 'Remix image',
  },
  upload: {
    imageHelp: (maxMb: number) =>
      `PNG, JPG, GIF or WebP, max ${maxMb}MB. Optional for videos — we grab the first frame.`,
    videoHelp: (maxMb: number) =>
      `MP4, MOV or WebM, max ${maxMb}MB. Adding one makes it a video meme.`,
    imageLabel: 'Image',
    videoLabel: 'Video',
  },
  url: {
    help: 'Paste a direct image link, or a giphy/imgur/reddit page — we grab the main image.',
    fetch: 'Fetch image',
  },
  preview: {
    yourMeme: 'your meme',
    videoA11y: 'Video preview',
    previewOf: (label: string) => `Preview of ${label}`,
    untitled: 'Untitled',
    freshlyMinted: (tierName: string) => `${tierName} · freshly minted`,
    originFromAuthor: (provider: string, author: string) => `from ${provider} · @${author}`,
    originFrom: (provider: string) => `from ${provider}`,
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
