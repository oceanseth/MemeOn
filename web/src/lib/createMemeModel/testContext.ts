import { freshCreateMemeDefaults, type CreateMemeContext } from '../../stores/createMemeMachine'

export const baseCreateMemeContext: CreateMemeContext = {
  ...freshCreateMemeDefaults(),
  remixId: null,
  mode: 'generate',
  title: 'title',
  tags: 'chaos',
  prompt: 'capybara',
  imageUrl: '/thumb.png',
}
