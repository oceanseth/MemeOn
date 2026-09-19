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
    notALink: 'That is not a link — paste a full https:// address.',
    renderFailed: "The video render didn't finish. Try again, or reopen this page if a job is still running.",
    giphySearchFailed: "GIPHY search didn't work. Try another word, or pick a category.",
    resolveFailed: "Couldn't find an image on that page. Check the link and try again.",
    editFailed: "That Masky edit didn't finish. Try again.",
    remixFailed: "That Masky remix didn't finish. Try again.",
    videoGenerationFailed: "That Masky video didn't finish. Try again.",
    generationFailed: "That Masky image didn't finish. Try again.",
    animationFailed: "That Masky animation didn't finish. Try again.",
    mintFailed: "The card didn't mint. Try again.",
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
    titlePlaceholder: 'e.g. cursed capybara',
    titleHelp: (max: number) => `Up to ${max} characters — it has to fit the card banner.`,
    tagsPlaceholder: 'animals, chaos',
    tagsHelp: (max: number) => `Up to ${max} tags, comma-separated — this is how people find it.`,
    success: {
      copied: 'Share link copied to your clipboard.',
      minted: 'Minted. Your card is live and the share link is ready.',
      heading: 'Minted. It is live.',
      body: 'All 100 shares are yours. Send the link — every reshare pushes the card up the tier ladder.',
      copyLink: 'Copy share link',
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
    /* the picker's own words. A native file input writes these itself, in the browser's locale
       and nobody's voice; `atoms/file-drop` takes them from here instead. */
    chooseImage: 'Choose an image',
    chooseVideo: 'Choose a video',
    dropHint: 'or drop one here',
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
