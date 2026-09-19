import { observer } from 'mobx-react-lite'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useCreateMemeScreen } from '../hooks/useCreateMemeScreen'
import { CreateMemeScreen } from '../screens/CreateMemeScreen'

export const CreateMemeView = observer(function CreateMemeView() {
  const model = useCreateMemeScreen()
  useDocumentTitle(model.pageTitle)
  return <CreateMemeScreen {...model} />
})
