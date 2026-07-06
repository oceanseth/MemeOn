// Renders a meme's media: autoplaying looped muted video when it has one,
// otherwise the still image.
import { useVideoPlayer, VideoView } from 'expo-video'
import { Image, type StyleProp, type ViewStyle } from 'react-native'
import type { Meme } from '../lib/types'

export function MemeMedia({
  meme,
  style,
  muted = true,
}: {
  meme: Pick<Meme, 'mediaType' | 'imageUrl' | 'videoUrl'>
  style: StyleProp<ViewStyle>
  muted?: boolean
}) {
  if (meme.mediaType === 'video' && meme.videoUrl) {
    return <MemeVideo url={meme.videoUrl} style={style} muted={muted} />
  }
  return <Image source={{ uri: meme.imageUrl }} style={style as never} resizeMode="cover" />
}

function MemeVideo({
  url,
  style,
  muted,
}: {
  url: string
  style: StyleProp<ViewStyle>
  muted: boolean
}) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true
    p.muted = muted
    p.play()
  })
  return <VideoView player={player} style={style} contentFit="cover" nativeControls={false} />
}
