import { beforeEach, describe, expect, it } from 'vitest'
import { authMock } from './authMock'
import { staffMock } from './staffMock'
import { mockStorage } from './storage'

beforeEach(async () => {
  mockStorage.clearAll()
  await authMock.signInAs('staff')
})

describe('Aşama 5 — personel demo servisleri', () => {
  it('personelin görev panelini ve anonim demo sorularını gösterir', async () => {
    const dashboard = await staffMock.getDashboard()
    expect(dashboard.isDemo).toBe(true)
    const questions = await staffMock.listQuestions()
    expect(questions.length).toBeGreaterThan(0)
    expect(questions.every((q) => !q.email && !q.studentId)).toBe(true)
  })
  it('görev soru durumunu günceller', async () => {
    const [question] = await staffMock.listQuestions()
    const changed = await staffMock.updateQuestionStatus(question.id, 'reviewing')
    expect(changed.status).toBe('reviewing')
    expect((await staffMock.listQuestions()).find((q) => q.id === question.id).status).toBe('reviewing')
    await expect(staffMock.updateQuestionStatus(question.id, 'invalid')).rejects.toMatchObject({status:422})
  })
  it('yeni belge için PDF metadata ister, baytları kaydetmez', async () => {
    const fields = {proposalType:'new',title:'Demo yönerge',category:'Staj İşlemleri',documentDate:'2026-10-10',description:'Demo düzenleme önerisi'}
    await expect(staffMock.createDocumentProposal(fields)).rejects.toMatchObject({status:422})
    const result = await staffMock.createDocumentProposal({...fields,fileName:'demo.pdf',fileSize:327})
    expect(result.status).toBe('pending')
    expect(result.fileStored).toBe(false)
    expect((await staffMock.listDocumentProposals()).map((x) => x.id)).toContain(result.id)
  })
  it('taslak duyuru oluşturup onaya gönderir', async () => {
    const data = {title:'Örnek duyuru',category:'Genel',content:'Demo içerik'}
    const initial = await staffMock.createAnnouncementProposal({...data,status:'draft'})
    expect(initial.status).toBe('draft')
    const changed = await staffMock.updateAnnouncementProposal(initial.id,{...data,status:'pending'})
    expect(changed.status).toBe('pending')
    await expect(staffMock.updateAnnouncementProposal(initial.id,{...data,status:'draft'})).rejects.toMatchObject({status:409})
  })
  it('öğrenci ve onay bekleyen personel erişimi reddedilir', async () => {
    await authMock.signInAs('student')
    await expect(staffMock.getDashboard()).rejects.toMatchObject({status:403})
    await authMock.signInAs('pendingStaff')
    await expect(staffMock.listQuestions()).rejects.toMatchObject({status:403})
  })
  it('önerileri yalnızca sahibi listeler', async () => {
    const fields = {title:'Kişisel taslak',category:'Genel',content:'Deneme',status:'draft'}
    const first = await staffMock.createAnnouncementProposal(fields)
    await authMock.signInAs('admin')
    await expect(staffMock.listAnnouncementProposals()).rejects.toMatchObject({status:403})
    await authMock.signInAs('staff')
    const own = await staffMock.listAnnouncementProposals()
    expect(own).toHaveLength(1)
    expect(own[0].id).toBe(first.id)
  })
})
