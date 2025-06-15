import { renderHook, act } from '@testing-library/react'
import { useJitsi } from '../client/src/components/call/useJitsi'

const mockConnect = jest.fn()
const mockInitConf = jest.fn(() => ({
  on: jest.fn(),
  join: jest.fn(),
  addTrack: jest.fn()
}))

beforeEach(() => {
  ;(global as any).JitsiMeetJS = {
    init: jest.fn(),
    JitsiConnection: function (_: any, __: any, opts: any) {
      this.options = opts
      this.connect = mockConnect
      this.addEventListener = (_ev: string, cb: any) => {
        cb()
      }
      this.initJitsiConference = mockInitConf
    },
    createLocalTracks: jest.fn(() => Promise.resolve([])),
    events: {
      connection: { CONNECTION_ESTABLISHED: 'est' , CONNECTION_FAILED: 'fail' },
      conference: { TRACK_ADDED: 'ta', USER_JOINED: 'uj', USER_LEFT: 'ul' }
    }
  }
})

test('startCall задает правильный serviceUrl', async () => {
  const { result } = renderHook(() => useJitsi('room1'))
  await act(async () => {
    await result.current.startCall()
  })
  const instance: any = mockConnect.mock.instances[0]
  expect((instance as any).options.serviceUrl).toBe('wss://meet.local.company/xmpp-websocket')
})
