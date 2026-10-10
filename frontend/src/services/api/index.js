import { chatApi, homeApi } from './chatApi'
// Gerçek backend uygulaması. Mock ile aynı fonksiyon imzalarını sunar.
import { authApi } from './authApi'

export const authService = authApi

export const chatService = chatApi
export const homeService = homeApi

import { statsApi, documentsApi, faqApi, announcementsApi } from './stage4Api'
export const statsService = statsApi
export const documentsService = documentsApi
export const faqService = faqApi
export const announcementsService = announcementsApi

import { staffApi } from './staffApi'
export const staffService = staffApi

import { adminApi } from './adminApi'
export const adminService = adminApi
