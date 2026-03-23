import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { SettingsContext } from 'contexts/SettingsContext'
import { ShellContext } from 'contexts/ShellContext'
import { userSettingsContextStubFactory } from 'test-utils/stubs/settingsContext'
import { MessageForm } from './MessageForm'

const mockUserId = 'user-123'
const userSettingsStub = userSettingsContextStubFactory({
  userId: mockUserId,
})

const mockShellContext = {
  showAlert: vi.fn(),
  setPeerList: vi.fn(),
  setPeerConnectionTypes: vi.fn(),
  tabHasFocus: true,
  setRoomId: vi.fn(),
  setPassword: vi.fn(),
  roomId: 'test-room',
  customUsername: '',
  updatePeer: vi.fn(),
  peerRoomRef: { current: null },
  messageLog: { directMessageLog: {}, groupMessageLog: [] },
  setMessageLog: vi.fn(),
  peerList: [],
}

const MockMessageForm = (props: any) => (
  // @ts-ignore
  <ShellContext.Provider value={mockShellContext}>
    <SettingsContext.Provider value={userSettingsStub}>
      <MessageForm {...props} />
    </SettingsContext.Provider>
  </ShellContext.Provider>
)

describe('MessageForm Drag & Drop / Paste', () => {
  let onInlineMediaUpload: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onInlineMediaUpload = vi.fn()
    vi.clearAllMocks()
  })

  test('calls onInlineMediaUpload when an image is pasted', () => {
    render(
      <MockMessageForm
        onMessageSubmit={vi.fn()}
        onMessageChange={vi.fn()}
        isMessageSending={false}
        onInlineMediaUpload={onInlineMediaUpload}
      />
    )

    const input = screen.getByRole('textbox')
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' })

    // Simulate paste event with files
    fireEvent.paste(input, {
      clipboardData: {
        files: [file],
      },
    })

    expect(onInlineMediaUpload).toHaveBeenCalledWith([file])
    expect(mockShellContext.showAlert).toHaveBeenCalledWith(
      'Sending pasted image...',
      { severity: 'info' }
    )
  })

  test('does not call onInlineMediaUpload when non-media file is pasted', () => {
    render(
      <MockMessageForm
        onMessageSubmit={vi.fn()}
        onMessageChange={vi.fn()}
        isMessageSending={false}
        onInlineMediaUpload={onInlineMediaUpload}
      />
    )

    const input = screen.getByRole('textbox')
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' })

    fireEvent.paste(input, {
      clipboardData: {
        files: [file],
      },
    })

    expect(onInlineMediaUpload).not.toHaveBeenCalled()
  })

  test('calls onInlineMediaUpload when an image is dropped', () => {
    const { container } = render(
      <MockMessageForm
        onMessageSubmit={vi.fn()}
        onMessageChange={vi.fn()}
        isMessageSending={false}
        onInlineMediaUpload={onInlineMediaUpload}
      />
    )

    const form = container.querySelector('form')!
    const file = new File(['dummy content'], 'test.png', { type: 'video/mp4' })

    // Simulate drop event with files
    fireEvent.drop(form, {
      dataTransfer: {
        files: [file],
      },
    })

    expect(onInlineMediaUpload).toHaveBeenCalledWith([file])
    expect(mockShellContext.showAlert).toHaveBeenCalledWith(
      'Sending dropped files...',
      { severity: 'info' }
    )
  })

  test('shows error alert and blocks file if it exceeds size limit', () => {
    render(
      <MockMessageForm
        onMessageSubmit={vi.fn()}
        onMessageChange={vi.fn()}
        isMessageSending={false}
        onInlineMediaUpload={onInlineMediaUpload}
      />
    )

    const input = screen.getByRole('textbox')
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' })
    // Mock a large file size (51 MB)
    Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 })

    fireEvent.paste(input, {
      clipboardData: {
        files: [file],
      },
    })

    expect(onInlineMediaUpload).not.toHaveBeenCalled()
    expect(mockShellContext.showAlert).toHaveBeenCalledWith(
      'File is too large. Maximum size is 50MB',
      { severity: 'error' }
    )
  })
})
