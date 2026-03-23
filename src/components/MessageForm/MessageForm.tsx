import React, {
  KeyboardEvent,
  SyntheticEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import FormControl from '@mui/material/FormControl'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Fab from '@mui/material/Fab'
import ArrowUpward from '@mui/icons-material/ArrowUpward'
import { useTranslation } from 'react-i18next'
import Box from '@mui/material/Box'

import { messageCharacterSizeLimit } from 'config/messaging'
import { ShellContext } from 'contexts/ShellContext'
import { SettingsContext } from 'contexts/SettingsContext'
import { Form } from 'components/Elements'

interface MessageFormProps {
  onMessageSubmit: (message: string) => void
  onMessageChange: (message: string) => void
  isMessageSending: boolean
  onInlineMediaUpload?: (files: File[]) => void
}

const MAX_FILE_SIZE_MB = 50

export const MessageForm = ({
  onMessageSubmit,
  onMessageChange,
  isMessageSending,
  onInlineMediaUpload,
}: MessageFormProps) => {
  const { t } = useTranslation()
  const { showAlert } = useContext(ShellContext)
  const settingsContext = useContext(SettingsContext)
  const { showActiveTypingStatus } = settingsContext.getUserSettings()
  const textFieldRef = useRef<HTMLInputElement>(null)
  const [textMessage, setTextMessage] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)

  useEffect(() => {
    const { current: textField } = textFieldRef
    if (!textField) return

    textField.focus()
  }, [textFieldRef])

  const canMessageBeSent = () => {
    return (
      textMessage.trim().length > 0 &&
      textMessage.length < messageCharacterSizeLimit &&
      !isMessageSending
    )
  }

  const handleMessageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setTextMessage(value)
    onMessageChange(value)
  }

  const submitMessage = () => {
    onMessageSubmit(textMessage)
    setTextMessage('')
  }

  const handleMessageKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    const { key, shiftKey } = event

    if (key === 'Enter' && shiftKey === false) {
      event.preventDefault()

      if (!canMessageBeSent()) return

      submitMessage()
    }
  }

  const handleMessageSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitMessage()
  }

  const validateAndUploadFiles = (files: File[], fallbackMessage: string) => {
    if (!onInlineMediaUpload || files.length === 0) return

    const validFiles = files.filter(
      f => f.size <= MAX_FILE_SIZE_MB * 1024 * 1024
    )
    if (validFiles.length < files.length) {
      showAlert(t('fileShare.fileTooLarge', { maxSize: MAX_FILE_SIZE_MB }), {
        severity: 'error',
      })
    }

    const mediaFiles = validFiles.filter(
      f =>
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        f.type.startsWith('audio/')
    )

    if (mediaFiles.length > 0) {
      showAlert(t(fallbackMessage), { severity: 'info' })
      onInlineMediaUpload(mediaFiles)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUploadFiles(
        Array.from(e.dataTransfer.files),
        'fileShare.dragDropSending'
      )
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      validateAndUploadFiles(
        Array.from(e.clipboardData.files),
        'fileShare.pasteImageSending'
      )
    }
  }

  return (
    <Form
      onSubmit={handleMessageSubmit}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        ...(showActiveTypingStatus && {
          pt: 2,
          px: 2,
        }),
        ...(!showActiveTypingStatus && {
          p: 2,
        }),
        position: 'relative',
        transition: 'background-color 0.2s, border 0.2s',
        ...(isDragOver && {
          backgroundColor: 'action.hover',
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 1,
        }),
      }}
    >
      {isDragOver && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
            borderRadius: 1,
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{ typography: 'h6', color: 'primary.main', fontWeight: 'bold' }}
          >
            {t('fileShare.dropFilesHere')}
          </Box>
        </Box>
      )}
      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <TextField
            variant="outlined"
            value={textMessage}
            onChange={handleMessageChange}
            onKeyPress={handleMessageKeyPress}
            onPaste={handlePaste}
            size="medium"
            placeholder={t('room.yourMessage')}
            inputRef={textFieldRef}
            multiline
          />
        </FormControl>
        <Fab
          sx={{
            flexShrink: 0,
            // The !important is needed to override a Stack style
            marginTop: 'auto!important',
          }}
          aria-label={t('common.send')}
          type="submit"
          disabled={!canMessageBeSent()}
          color="primary"
        >
          <ArrowUpward />
        </Fab>
      </Stack>
    </Form>
  )
}
