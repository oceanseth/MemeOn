import { observer } from 'mobx-react-lite'
import { useCreateMemeScreen } from '../hooks/useCreateMemeScreen'
import { CreateMemeScreen } from '../screens/CreateMemeScreen'

export const CreateMemeView = observer(function CreateMemeView() {
  return <CreateMemeScreen {...useCreateMemeScreen()} />
})
