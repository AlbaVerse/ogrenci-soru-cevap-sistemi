import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { Spinner } from '@/components/ui/Spinner'
import { ROUTES } from '@/config/routes'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'
import { VerifyPendingPage } from '@/pages/auth/VerifyPendingPage'
import ProfilePage from '@/pages/student/ProfilePage'
import { HomePage } from '@/pages/student/HomePage'
import { ChatPage } from '@/pages/chat/ChatPage'
import { HistoryPage } from '@/pages/chat/HistoryPage'
import { GeneralStatsPage } from '@/pages/student/GeneralStatsPage'
import { PersonalStatsPage } from '@/pages/student/PersonalStatsPage'
import { FaqPage } from '@/pages/student/FaqPage'
import { GuidePage } from '@/pages/student/GuidePage'
import { DocumentsPage } from '@/pages/student/DocumentsPage'
import { DocumentDetailPage } from '@/pages/student/DocumentDetailPage'
import { AnnouncementsPage } from '@/pages/student/AnnouncementsPage'
import { AnnouncementDetailPage } from '@/pages/student/AnnouncementDetailPage'
import { StaffDashboardPage } from '@/pages/staff/StaffDashboardPage'
import { StaffQuestionsPage } from '@/pages/staff/StaffQuestionsPage'
import { StaffDocumentsPage, StaffDocumentProposalNewPage } from '@/pages/staff/StaffDocumentsPage'
import { StaffAnnouncementsPage, StaffAnnouncementProposalNewPage } from '@/pages/staff/StaffAnnouncementsPage'
import { StaffStatsPage } from '@/pages/staff/StaffStatsPage'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminProposalsPage } from '@/pages/admin/AdminProposalsPage'
import { AdminDocumentsPage } from '@/pages/admin/AdminDocumentsPage'
import { AdminAnnouncementsPage } from '@/pages/admin/AdminAnnouncementsPage'
import { AdminFeedbackPage } from '@/pages/admin/AdminFeedbackPage'
import { AdminReportsPage } from '@/pages/admin/AdminReportsPage'
import { NotFound } from '@/pages/shared/NotFound'
import { GuestRoute, ProtectedRoute, RoleRoute } from './guards'

// Tasarım sistemi sayfası yalnızca geliştirme sunucusunda bulunur; üretim paketine girmez.
const DesignSystemPage = import.meta.env.DEV ? lazy(() => import('@/pages/dev/DesignSystemPage')) : null

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.register} element={<RegisterPage />} />
        <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
      </Route>
      {/* Doğrulama sayfaları herkese açıktır: doğrulanmamış hesap oturum açamaz. */}
      <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />
      <Route path={ROUTES.verifyPending} element={<VerifyPendingPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.chatNew} element={<ChatPage />} />
          <Route path={ROUTES.chatPattern} element={<ChatPage />} />
          <Route path={ROUTES.history} element={<HistoryPage />} />
          <Route path={ROUTES.statsGeneral} element={<GeneralStatsPage />} />
          <Route path={ROUTES.statsPersonal} element={<PersonalStatsPage />} />
          <Route path={ROUTES.faq} element={<FaqPage />} />
          <Route path={ROUTES.guide} element={<GuidePage />} />
          <Route path={ROUTES.announcements} element={<AnnouncementsPage />} />
          <Route path={ROUTES.announcementPattern} element={<AnnouncementDetailPage />} />
          <Route path={ROUTES.documents} element={<DocumentsPage />} />
          <Route path={ROUTES.documentPattern} element={<DocumentDetailPage />} />
          <Route path={ROUTES.profile} element={<ProfilePage />} />

          <Route element={<RoleRoute allow={['staff']} />}>
            <Route path={ROUTES.staff.home} element={<StaffDashboardPage />} />
            <Route path={ROUTES.staff.questions} element={<StaffQuestionsPage />} />
            <Route path={ROUTES.staff.documentProposals} element={<StaffDocumentsPage />} />
            <Route path={ROUTES.staff.documentProposalNew} element={<StaffDocumentProposalNewPage />} />
            <Route path={ROUTES.staff.announcementProposals} element={<StaffAnnouncementsPage />} />
            <Route path={ROUTES.staff.announcementProposalNew} element={<StaffAnnouncementProposalNewPage />} />
            <Route path={ROUTES.staff.stats} element={<StaffStatsPage />} />
          </Route>

          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path={ROUTES.admin.home} element={<AdminDashboardPage />} />
            <Route path={ROUTES.admin.users} element={<AdminUsersPage />} />
            <Route path={ROUTES.admin.staffRequests} element={<AdminProposalsPage type="staff" />} />
            <Route path={ROUTES.admin.documents} element={<AdminDocumentsPage />} />
            <Route path={ROUTES.admin.documentProposals} element={<AdminProposalsPage type="documents" />} />
            <Route path={ROUTES.admin.announcements} element={<AdminAnnouncementsPage />} />
            <Route path={ROUTES.admin.announcementProposals} element={<AdminProposalsPage type="announcements" />} />
            <Route path={ROUTES.admin.feedback} element={<AdminFeedbackPage />} />
            <Route path={ROUTES.admin.reports} element={<AdminReportsPage />} />
          </Route>

          {DesignSystemPage && (
            <Route
              path={ROUTES.designSystem}
              element={
                <Suspense fallback={<Spinner className="m-8" />}>
                  <DesignSystemPage />
                </Suspense>
              }
            />
          )}
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
