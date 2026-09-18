import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useCreateMemeScreen } from '../hooks/useCreateMemeScreen'
import { CreateMemeScreen } from '../screens/CreateMemeScreen'

export const CreateMemeView = observer(function CreateMemeView() {
  useDocumentTitle('Mint a meme')
  return <CreateMemeScreen {...useCreateMemeScreen()} />
})
