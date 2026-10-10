// Demo uygulaması. api/index.js ile aynı servis adlarını dışa aktarır.
import { authMock } from './authMock'
import { chatMock, homeMock } from './chatMock'

export const authService = authMock

export const chatService = chatMock
export const homeService = homeMock

import { statsMock, documentsMock, faqMock, announcementsMock } from './stage4Mock'
export const statsService = statsMock
export const documentsService = documentsMock
export const faqService = faqMock
export const announcementsService = announcementsMock

import { staffMock } from './staffMock'
export const staffService = staffMock

import { adminMock } from './adminMock'
export const adminService = adminMock
