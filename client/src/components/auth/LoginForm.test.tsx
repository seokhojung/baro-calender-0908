import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'
import { useAuthStore } from '@/stores/authStore'

// Mock the auth store
jest.mock('@/stores/authStore')
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

// Mock Next.js router
jest.mock('next/link', () => {
  const LinkComponent = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  LinkComponent.displayName = 'Link'
  return LinkComponent
})

describe('LoginForm', () => {
  const mockLogin = jest.fn()
  const mockLoginWithProvider = jest.fn()
  const mockVerifyTwoFactor = jest.fn()

  interface MockAuthStore {
    login: jest.MockedFunction<any>
    loginWithProvider: jest.MockedFunction<any>
    verifyTwoFactor: jest.MockedFunction<any>
    isLoading: boolean
    error: { message: string } | null
    requiresTwoFactor: boolean
    twoFactorToken: string | null
  }

  const defaultStoreState: MockAuthStore = {
    login: mockLogin,
    loginWithProvider: mockLoginWithProvider,
    verifyTwoFactor: mockVerifyTwoFactor,
    isLoading: false,
    error: null,
    requiresTwoFactor: false,
    twoFactorToken: null
  }

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue(defaultStoreState as ReturnType<typeof useAuthStore>)
    jest.clearAllMocks()
  })

  describe('Email Login Tab', () => {
    it('should render login form with email and password fields', () => {
      render(<LoginForm />)

      expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('비밀번호를 입력하세요')).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /로그인 상태 유지/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument()
    })

    it('should toggle password visibility', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByPlaceholderText('비밀번호를 입력하세요')
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i })

      expect(passwordInput).toHaveAttribute('type', 'password')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'text')

      await user.click(toggleButton)
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should validate email field', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByPlaceholderText('name@example.com')
      const loginButton = screen.getByRole('button', { name: '로그인' })

      await user.type(emailInput, 'invalid-email')
      await user.click(loginButton)

      expect(screen.getByText('올바른 이메일 주소를 입력해주세요')).toBeInTheDocument()
    })

    it('should validate password field', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByPlaceholderText('name@example.com')
      const loginButton = screen.getByRole('button', { name: '로그인' })

      await user.type(emailInput, 'test@example.com')
      await user.click(loginButton)

      expect(screen.getByText('비밀번호를 입력해주세요')).toBeInTheDocument()
    })

    it('should submit login form with valid data', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByPlaceholderText('name@example.com')
      const passwordInput = screen.getByPlaceholderText('비밀번호를 입력하세요')
      const rememberMeCheckbox = screen.getByRole('checkbox', { name: /로그인 상태 유지/ })
      const loginButton = screen.getByRole('button', { name: '로그인' })

      await user.type(emailInput, 'test@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(rememberMeCheckbox)
      await user.click(loginButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          rememberMe: true
        })
      })
    })

    it('should display loading state during login', () => {
      mockUseAuthStore.mockReturnValue({
        ...defaultStoreState,
        isLoading: true
      } as any)

      render(<LoginForm />)

      expect(screen.getByText('로그인 중...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /로그인 중/ })).toBeDisabled()
    })

    it('should display login error', () => {
      const errorMessage = 'Invalid credentials'
      mockUseAuthStore.mockReturnValue({
        ...defaultStoreState,
        error: { message: errorMessage }
      } as any)

      render(<LoginForm />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Social Login Tab', () => {
    it('should render social login buttons', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const socialTab = screen.getByRole('tab', { name: '소셜 로그인' })
      await user.click(socialTab)

      expect(screen.getByRole('button', { name: 'Google로 로그인' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'GitHub으로 로그인' })).toBeInTheDocument()
    })

    it('should handle Google login', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const socialTab = screen.getByRole('tab', { name: '소셜 로그인' })
      await user.click(socialTab)

      const googleButton = screen.getByRole('button', { name: 'Google로 로그인' })
      await user.click(googleButton)

      expect(mockLoginWithProvider).toHaveBeenCalledWith('google')
    })

    it('should handle GitHub login', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const socialTab = screen.getByRole('tab', { name: '소셜 로그인' })
      await user.click(socialTab)

      const githubButton = screen.getByRole('button', { name: 'GitHub으로 로그인' })
      await user.click(githubButton)

      expect(mockLoginWithProvider).toHaveBeenCalledWith('github')
    })
  })

  describe('Two Factor Authentication', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        ...defaultStoreState,
        requiresTwoFactor: true,
        twoFactorToken: 'mock-2fa-token'
      } as any)
    })

    it('should render 2FA form when required', () => {
      render(<LoginForm />)

      expect(screen.getByText('2단계 인증')).toBeInTheDocument()
      expect(screen.getByText('인증 앱에 표시된 6자리 코드를 입력해주세요')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '인증 확인' })).toBeInTheDocument()
    })

    it('should submit 2FA code', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      // Get all OTP input slots
      const otpSlots = screen.getAllByRole('textbox')
      
      // Fill in the 6-digit code
      const code = '123456'
      for (let i = 0; i < 6; i++) {
        if (otpSlots[i]) {
          await user.type(otpSlots[i]!, code[i]!)
        }
      }

      const verifyButton = screen.getByRole('button', { name: '인증 확인' })
      await user.click(verifyButton)

      await waitFor(() => {
        expect(mockVerifyTwoFactor).toHaveBeenCalledWith('mock-2fa-token', '123456')
      })
    })

    it('should validate 2FA code length', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const verifyButton = screen.getByRole('button', { name: '인증 확인' })
      await user.click(verifyButton)

      expect(screen.getByText('6자리 코드를 입력해주세요')).toBeInTheDocument()
    })

    it('should display 2FA loading state', () => {
      mockUseAuthStore.mockReturnValue({
        ...defaultStoreState,
        requiresTwoFactor: true,
        twoFactorToken: 'mock-2fa-token',
        isLoading: true
      } as any)

      render(<LoginForm />)

      expect(screen.getByText('인증 중...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /인증 중/ })).toBeDisabled()
    })

    it('should display 2FA error', () => {
      const errorMessage = 'Invalid 2FA code'
      mockUseAuthStore.mockReturnValue({
        ...defaultStoreState,
        requiresTwoFactor: true,
        twoFactorToken: 'mock-2fa-token',
        error: { message: errorMessage }
      } as any)

      render(<LoginForm />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should allow going back to login form', async () => {
      const mockSetState = jest.fn()
      
      // Mock useAuthStore.setState
      ;(useAuthStore as any).setState = mockSetState

      const user = userEvent.setup()
      render(<LoginForm />)

      const backButton = screen.getByRole('button', { name: '다시 로그인하기' })
      await user.click(backButton)

      expect(mockSetState).toHaveBeenCalledWith({
        requiresTwoFactor: false,
        twoFactorToken: null,
        error: null
      })
    })
  })

  describe('Navigation Links', () => {
    it('should render forgot password link', () => {
      render(<LoginForm />)

      const forgotPasswordLink = screen.getByRole('link', { name: '비밀번호 찾기' })
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password')
    })

    it('should render signup link', () => {
      render(<LoginForm />)

      const signupLink = screen.getByRole('link', { name: '회원가입' })
      expect(signupLink).toHaveAttribute('href', '/signup')
    })
  })

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText('이메일')).toBeInTheDocument()
      expect(screen.getByLabelText('비밀번호')).toBeInTheDocument()
    })

    it('should have proper button descriptions', () => {
      render(<LoginForm />)

      const passwordToggle = screen.getByRole('button')
      expect(passwordToggle).toHaveAttribute('tabIndex', '-1') // Should not be focusable via tab
    })

    it('should have proper form validation messages', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const loginButton = screen.getByRole('button', { name: '로그인' })
      await user.click(loginButton)

      const emailError = screen.getByText('올바른 이메일 주소를 입력해주세요')
      const passwordError = screen.getByText('비밀번호를 입력해주세요')

      expect(emailError).toBeInTheDocument()
      expect(passwordError).toBeInTheDocument()
    })
  })
})