import * as mockImpl from '../mocks'
import * as apiImpl from './api'

export const authService = mockImpl.authService
export const homeService = mockImpl.homeService
export const statsService = apiImpl.statsApi
export const documentsService = mockImpl.documentsService
export const faqService = mockImpl.faqService
export const announcementsService = mockImpl.announcementsService
export const staffService = mockImpl.staffService
export const adminService = mockImpl.adminService

export const chatService = apiImpl.chatService