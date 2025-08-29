import { MessagePlugin } from 'tdesign-react'

export const showSuccess = (msg: string) => {
  MessagePlugin.success(msg)
}

export const showError = (msg: string) => {
  MessagePlugin.error(msg)
}