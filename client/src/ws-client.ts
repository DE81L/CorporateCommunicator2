import { toast } from './hooks/use-toast'
import i18n from './i18n'

let socket: WebSocket | null = null

export function initWsClient(url: string) {
  socket = new WebSocket(url)
  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data)

    if (msg.type === 'chat') {
      // логика обновления стора будет здесь
      if (window.location.pathname !== `/chat/${msg.from}`) {
        toast({
          title: i18n.t('notifications.newMessage', { name: msg.fromName }),
          description: msg.text,
        })
      }
    }

    if (msg.type === 'group-invite') {
      toast({
        title: i18n.t('notifications.groupInvite'),
        description: i18n.t('notifications.addedToGroup', { groupName: msg.payload.groupName }),
      })
    }
  }
}
