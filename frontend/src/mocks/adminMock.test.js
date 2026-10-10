import { beforeEach, describe, expect, it } from 'vitest'
import { authMock } from './authMock'
import { staffMock } from './staffMock'
import { adminMock } from './adminMock'
import { announcementsMock, documentsMock } from './stage4Mock'
import { mockStorage } from './storage'

beforeEach(async () => {
  mockStorage.clearAll()
  await authMock.signInAs('admin')
})

describe('Aşama 6 — demo admin servisleri', () => {
  it('öğrenci ve personeli reddeder, admin hesabını değiştirmez', async () => {
    const users=await adminMock.listUsers()
    const administrator=users.find(u=>u.role==='admin')
    await expect(adminMock.updateUserRole(administrator.id,'student')).rejects.toMatchObject({status:403})
    await authMock.signInAs('student')
    await expect(adminMock.listUsers()).rejects.toMatchObject({status:403})
    await authMock.signInAs('staff')
    await expect(adminMock.getDashboard()).rejects.toMatchObject({status:403})
  })

  it('personel başvurularını onaylar, ikinci defa onaylanamaz', async () => {
    const item=(await adminMock.listStaffRequests()).find(x=>x.staffApprovalStatus==='pending')
    expect(item).toBeTruthy()
    const updated=await adminMock.decideStaffRequest(item.id,'approved')
    expect(updated.role).toBe('staff')
    await expect(adminMock.decideStaffRequest(item.id,'approved')).rejects.toMatchObject({status:409})
  })

  it('personel önerilerini görür; admin onayı duyuru ve belge metadata listelerine yansır', async () => {
    await authMock.signInAs('staff')
    const doc=await staffMock.createDocumentProposal({proposalType:'new',title:'Örnek',description:'İçerik',category:'Staj İşlemleri',documentDate:'2026-10-10',fileName:'ornek.pdf'})
    const news=await staffMock.createAnnouncementProposal({title:'Duyuru',category:'Genel',content:'Örnek metin',status:'pending'})
    await authMock.signInAs('admin')
    expect((await adminMock.listDocumentProposals()).map(x=>x.id)).toContain(doc.id)
    expect((await adminMock.listAnnouncementProposals()).map(x=>x.id)).toContain(news.id)
    await expect(adminMock.decideDocumentProposal(doc.id,'rejected','')).rejects.toMatchObject({status:422})
    await adminMock.decideDocumentProposal(doc.id,'approved')
    await adminMock.decideAnnouncementProposal(news.id,'approved')
    expect((await documentsMock.getDocuments()).some(x=>x.approvedProposalId===doc.id&&x.fileUrl===null)).toBe(true)
    expect((await announcementsMock.getPublishedAnnouncements()).some(x=>x.approvedProposalId===news.id)).toBe(true)
    await authMock.signInAs('staff')
    expect((await staffMock.listDocumentProposals()).find(x=>x.id===doc.id).status).toBe('approved')
    expect((await staffMock.listAnnouncementProposals()).find(x=>x.id===news.id).status).toBe('approved')
  })

  it('belge oluşturma, düzenleme ve arşivleme işlemleri yalnızca demo metadata etkiler', async () => {
    const doc=await adminMock.createDocument({title:'Test',category:'Staj İşlemleri',documentDate:'2026-10-10',description:'Kısa',fileName:'demo.pdf'})
    expect(doc.fileUrl).toBeNull()
    expect((await adminMock.updateDocument(doc.id,{title:'Güncel',category:'Staj İşlemleri',documentDate:'2026-10-10',description:'Yeni'})).title).toBe('Güncel')
    await adminMock.archiveDocument(doc.id)
    expect((await documentsMock.getDocuments()).some(x=>x.id===doc.id)).toBe(false)
  })

  it('admin duyuru yayınlar/düzenler ve kullanıcı sayfasında demo yayın görünür', async () => {
    const item=await adminMock.createAnnouncement({title:'İlk',content:'Metin',category:'Genel'})
    await adminMock.updateAnnouncement(item.id,{title:'Yeni',content:'Düzenlendi',category:'Genel'})
    expect((await announcementsMock.getPublishedAnnouncements()).find(x=>x.id===item.id).title).toBe('Yeni')
  })
})
