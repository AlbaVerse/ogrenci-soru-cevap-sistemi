import { IS_MOCK } from '@/config/env'
import * as mockImpl from '../mocks'
import * as apiImpl from './api'

export const authService = IS_MOCK ? mockImpl.authService : apiImpl.authApi
export const homeService = IS_MOCK ? mockImpl.homeService : apiImpl.homeApi
export const statsService = apiImpl.statsApi || mockImpl.statsService
export const documentsService = mockImpl.documentsService
export const faqService = mockImpl.faqService
export const announcementsService = mockImpl.announcementsService
export const staffService = IS_MOCK ? mockImpl.staffService : (apiImpl.staffApi || mockImpl.staffService)
export const adminService = IS_MOCK ? mockImpl.adminService : (apiImpl.adminApi || mockImpl.adminService)

export const chatService = apiImpl.chatApi || apiImpl.chatService || mockImpl.chatService