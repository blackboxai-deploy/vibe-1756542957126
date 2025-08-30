```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@hospity/db'
import { compare } from 'bcryptjs'
import { Twilio } from 'twilio'
import { randomBytes } from 'crypto'

const twilioClient = new Twilio(
  process.env.TWILIO_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    CredentialsProvider({
      id: 'email-otp',
      name: 'Email OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.otp) {
          return null
        }

        try {
          const otpRecord = await prisma.oTPVerification.findFirst({
            where: {
              email: credentials.email,
              code: credentials.otp,
              type: 'EMAIL',
              expiresAt: {
                gt: new Date()
              },
              verified: false
            }
          })

          if (!otpRecord) {
            return null
          }

          await prisma.oTPVerification.update({
            where: { id: otpRecord.id },
            data: { verified: true }
          })

          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { tenant: true }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: credentials.email,
                emailVerified: new Date(),
                role: 'CUSTOMER'
              },
              include: { tenant: true }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            tenantId: user.tenantId,
            phone: user.phone,
            phoneVerified: user.phoneVerified
          }
        } catch (error) {
          console.error('Email OTP authorization error:', error)
          return null
        }
      }
    }),
    CredentialsProvider({
      id: 'phone-otp',
      name: 'Phone OTP',
      credentials: {
        phone: { label: 'Phone', type: 'tel' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.otp) {
          return null
        }

        try {
          const otpRecord = await prisma.oTPVerification.findFirst({
            where: {
              phone: credentials.phone,
              code: credentials.otp,
              type: 'SMS',
              expiresAt: {
                gt: new Date()
              },
              verified: false
            }
          })

          if (!otpRecord) {
            return null
          }

          await prisma.oTPVerification.update({
            where: { id: otpRecord.id },
            data: { verified: true }
          })

          let user = await prisma.user.findUnique({
            where: { phone: credentials.phone },
            include: { tenant: true }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                phone: credentials.phone,
                phoneVerified: new Date(),
                role: 'CUSTOMER'
              },
              include: { tenant: true }
            })
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            tenantId: user.tenantId,
            phone: user.phone,
            phoneVerified: user.phoneVerified
          }
        } catch (error) {
          console.error('Phone OTP authorization error:', error)
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Device fingerprinting and session management
        const deviceFingerprint = generateDeviceFingerprint()
        
        if (account?.provider === 'google') {
          // Handle Google OAuth sign-in
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
            include: { tenant: { include: { plan: true } } }
          })

          if (existingUser) {
            // Check device limits
            const activeDevices = await prisma.deviceSession.count({
              where: {
                userId: existingUser.id,
                active: true
              }
            })

            const maxDevices = existingUser.tenant?.plan?.maxDevices || 1

            if (activeDevices >= maxDevices) {
              // Store pending session for device management
              await prisma.pendingDeviceSession.create({
                data: {
                  userId: existingUser.id,
                  fingerprint: deviceFingerprint,
                  deviceType: 'WEB',
                  userAgent: 'Unknown',
                  ipAddress: '0.0.0.0'
                }
              })
              return '/auth/device-limit-exceeded'
            }

            // Create new device session
            await prisma.deviceSession.create({
              data: {
                userId: existingUser.id,
                fingerprint: deviceFingerprint,
                deviceType: 'WEB',
                userAgent: 'Unknown',
                ipAddress: '0.0.0.0',
                active: true,
                lastSeen: new Date()
              }
            })
          }
        }

        return true
      } catch (error) {
        console.error('Sign-in callback error:', error)
        return false
      }
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.role = user.role
        token.tenantId = user.tenantId
        token.phone = user.phone
        token.phoneVerified = user.phoneVerified
      }

      // Refresh user data on each request
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            include: { tenant: true }
          })

          if (dbUser) {
            token.role = dbUser.role
            token.tenantId = dbUser.tenantId
            token.phone = dbUser.phone
            token.phoneVerified = dbUser.phoneVerified
          }
        } catch (error) {
          console.error('JWT callback error:', error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
        session.user.phone = token.phone as string
        session.user.phoneVerified = token.phoneVerified as Date
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      // Handle device limit exceeded redirect
      if (url.includes('device-limit-exceeded')) {
        return `${baseUrl}/auth/device-limit-exceeded`
      }

      // Redirect to appropriate dashboard based on role
      if (url === baseUrl) {
        return `${baseUrl}/dashboard`
      }

      // Allow relative callback URLs
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }

      // Allow callback URLs on the same origin
      if (new URL(url).origin === baseUrl) {
        return url
      }

      return baseUrl
    }
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request'
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log successful sign-in
      if (user.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            tenantId: user.tenantId || null,
            action: 'USER_SIGNIN',
            metadata: {
              provider: account?.provider,
              isNewUser,
              timestamp: new Date().toISOString()
            }
          }
        })
      }
    },
    async signOut({ token }) {
      // Deactivate device session on sign-out
      if (token?.sub) {
        await prisma.deviceSession.updateMany({
          where: {
            userId: token.sub,
            active: true
          },
          data: {
            active: false,
            lastSeen: new Date()
          }
        })

        // Log sign-out
        await prisma.auditLog.create({
          data: {
            userId: token.sub,
            tenantId: token.tenantId as string || null,
            action: 'USER_SIGNOUT',
            metadata: {
              timestamp: new Date().toISOString()
            }
          }
        })
      }
    }
  },
  debug: process.env.NODE_ENV === 'development'
}

function generateDeviceFingerprint(): string {
  // In a real implementation, this would use client-side fingerprinting
  // For now, generate a random fingerprint
  return randomBytes(16).toString('hex')
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Helper functions for OTP generation and sending
export async function sendEmailOTP(email: string): Promise<boolean> {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    await prisma.oTPVerification.create({
      data: {
        email,
        code,
        type: 'EMAIL',
        expiresAt
      }
    })

    // Send email (implement with your email provider)
    // await sendEmail({
    //   to: email,
    //   subject: 'Your Hospity.AI verification code',
    //   text: `Your verification code is: ${code}. This code will expire in 10 minutes.`
    // })

    console.log(`Email OTP for ${email}: ${code}`) // Remove in production

    return true
  } catch (error) {
    console.error('Send email OTP error:', error)
    return false
  }
}

export async function sendSMSOTP(phone: string): Promise<boolean> {
  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP in database
    await prisma.oTPVerification.create({
      data: {
        phone,
        code,
        type: 'SMS',
        expiresAt
      }
    })

    // Send SMS via Twilio
    await twilioClient.messages.create({
      body: `Your Hospity.AI verification code is: ${code}. This code will expire in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: phone
    })

    return true
  } catch (error) {
    console.error('Send SMS OTP error:', error)
    return false
  }
}
```