'use client'

import { useState, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Icons } from '@/components/ui/icons'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import Link from 'next/link'

const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const phoneLoginSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code')
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits')
})

type EmailLoginForm = z.infer<typeof emailLoginSchema>
type PhoneLoginForm = z.infer<typeof phoneLoginSchema>
type OtpForm = z.infer<typeof otpSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('email')

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  const emailForm = useForm<EmailLoginForm>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const phoneForm = useForm<PhoneLoginForm>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: ''
    }
  })

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: ''
    }
  })

  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case 'OAuthSignin':
          setError('Error occurred during OAuth signin')
          break
        case 'OAuthCallback':
          setError('Error occurred during OAuth callback')
          break
        case 'OAuthCreateAccount':
          setError('Could not create OAuth account')
          break
        case 'EmailCreateAccount':
          setError('Could not create email account')
          break
        case 'Callback':
          setError('Error occurred during callback')
          break
        case 'OAuthAccountNotLinked':
          setError('OAuth account not linked. Please use the same method you used to sign up.')
          break
        case 'EmailSignin':
          setError('Check your email for a signin link')
          break
        case 'CredentialsSignin':
          setError('Invalid credentials. Please check your email and password.')
          break
        case 'SessionRequired':
          setError('Please sign in to access this page')
          break
        case 'DeviceLimitExceeded':
          setError('Device limit exceeded for your plan. Please upgrade or manage your devices.')
          break
        default:
          setError('An error occurred during signin')
      }
    }
  }, [errorParam])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const result = await signIn('google', {
        callbackUrl,
        redirect: false
      })

      if (result?.error) {
        setError('Failed to sign in with Google')
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (data: EmailLoginForm) => {
    try {
      setIsLoading(true)
      setError('')

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })

      if (result?.error) {
        if (result.error === 'DeviceLimitExceeded') {
          setError('Device limit exceeded. Please upgrade your plan or manage existing devices.')
        } else {
          setError('Invalid email or password')
        }
      } else if (result?.ok) {
        // Check if user needs to verify phone
        const session = await getSession()
        if (session?.user?.phoneVerified === false) {
          router.push('/auth/verify-phone')
        } else {
          router.push(callbackUrl)
        }
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async (data: PhoneLoginForm) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: data.phone })
      })

      const result = await response.json()

      if (response.ok) {
        setPhoneNumber(data.phone)
        setShowOtpInput(true)
        toast.success('OTP sent to your phone')
      } else {
        setError(result.error || 'Failed to send OTP')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async (data: OtpForm) => {
    try {
      setIsLoading(true)
      setError('')

      const result = await signIn('credentials', {
        phone: phoneNumber,
        otp: data.otp,
        redirect: false
      })

      if (result?.error) {
        if (result.error === 'DeviceLimitExceeded') {
          setError('Device limit exceeded. Please upgrade your plan or manage existing devices.')
        } else {
          setError('Invalid OTP')
        }
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: phoneNumber })
      })

      if (response.ok) {
        toast.success('OTP resent successfully')
      } else {
        toast.error('Failed to resend OTP')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (showOtpInput) {
    return (
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Icons.logo className="mr-2 h-6 w-6" />
            Hospity.AI
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                "Hospity.AI has transformed how we manage our restaurant operations. The AI-powered ordering system is incredible."
              </p>
              <footer className="text-sm">Sofia Chen, Restaurant Owner</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Verify OTP</CardTitle>
                <CardDescription className="text-center">
                  Enter the 6-digit code sent to {phoneNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={otpForm.handleSubmit(handleOtpVerification)} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="otp">OTP Code</Label>
                    <Input
                      id="otp"
                      placeholder="123456"
                      type="text"
                      maxLength={6}
                      {...otpForm.register('otp')}
                      className="text-center text-lg tracking-widest"
                    />
                    {otpForm.formState.errors.otp && (
                      <p className="text-sm text-red-500">{otpForm.formState.errors.otp.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                    Verify OTP
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2">
                <Button variant="ghost" onClick={resendOtp} disabled={isLoading} className="w-full">
                  Resend OTP
                </Button>
                <Button variant="ghost" onClick={() => setShowOtpInput(false)} className="w-full">
                  Back to Phone Login
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Icons.logo className="mr-2 h-6 w-6" />
          Hospity.AI
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Hospity.AI has transformed how we manage our restaurant operations. The AI-powered ordering system is incredible."
            </p>
            <footer className="text-sm">Sofia Chen, Restaurant Owner</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your account to continue
            </p>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full mb-4"
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="phone">Phone</TabsTrigger>
                </TabsList>
                
                <TabsContent value="email" className="space-y-4 mt-4">
                  <form onSubmit={emailForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        placeholder="name@example.com"
                        type="email"
                        autoCapitalize="none"
                        autoComplete="email"
                        autoCorrect="off"
                        {...emailForm.register('email')}
                      />
                      {emailForm.formState.errors.email && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        placeholder="Enter your password"
                        type="password"
                        autoComplete="current-password"
                        {...emailForm.register('password')}
                      />
                      {emailForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{emailForm.formState.errors.password.message}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In with Email
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="phone" className="space-y-4 mt-4">
                  <form onSubmit={phoneForm.handleSubmit(handlePhoneLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="+1234567890"
                        type="tel"
                        {...phoneForm.register('phone')}
                      />
                      {phoneForm.formState.errors.phone && (
                        <p className="text-sm text-red-500">{phoneForm.formState.errors.phone.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Include country code (e.g., +1 for US)
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                      Send OTP
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <div className="text-sm text-center text-muted-foreground">
                <Link href="/auth/forgot-password" className="hover:text-primary underline underline-offset-4">
                  Forgot your password?
                </Link>
              </div>
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/register" className="hover:text-primary underline underline-offset-4">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our{' '}
            <Link href="/terms" className="hover:text-primary underline underline-offset-4">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="hover:text-primary underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}