/**
 * The strings the mint desk's engine speaks while it works: the busy line under the form and the
 * failure it settles on when a request throws nothing better. The form's own labels and captions
 * still live beside their builder in `lib/createMemeModel/`.
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
  },
} as const
