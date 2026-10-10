import { describe, expect, it } from 'vitest'
import { mapStats, mapDocuments, mapFaqs, mapAnnouncements } from './stage4Mapper'

describe('Aşama 4 API dönüştürücüleri', () => {
  it('snake_case istatistik alanlarını dönüşür', () => {
    expect(mapStats({total_questions:4, answered_count:2, unanswered_count:1, insufficient_count:1, average_response_time_ms:1800, category_breakdown:[{category:'Staj',count:4}], daily_trend:[{date:'2026-10-10',count:4}]})).toMatchObject({totalQuestions:4,answeredCount:2,unansweredCount:1,insufficientCount:1,averageResponseTimeMs:1800,categories:[{name:'Staj',count:4}],dailyTrend:[{date:'2026-10-10',count:4}]})
  })
  it('eksik yanıt süresini sıfır gibi sunmaz', () => {
    expect(mapStats({}).averageResponseTimeMs).toBeNull()
  })
  it('liste, items ve results şeklindeki yanıtları okur', () => {
    expect(mapDocuments({items:[{id:2,title:'Belge',file_url:null}]})).toMatchObject([{id:'2',title:'Belge',fileUrl:null}])
    expect(mapFaqs({results:[{id:1,question:'Nedir?',answer:'Açıklama'}]})).toMatchObject([{title:'Nedir?',content:'Açıklama'}])
    expect(mapAnnouncements([{id:1,published_at:'2026-10-10'}])).toMatchObject([{id:'1',publishedAt:'2026-10-10'}])
  })
})
