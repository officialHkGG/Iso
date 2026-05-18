import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

if (!process.env.GOOGLE_CLIENT_ID) {
  console.error("[v0] Missing GOOGLE_CLIENT_ID environment variable")
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  console.error("[v0] Missing GOOGLE_CLIENT_SECRET environment variable")
}
if (!process.env.NEXTAUTH_SECRET) {
  console.error("[v0] Missing NEXTAUTH_SECRET environment variable")
}

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.readonly",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      return session
    },
  },
})

export { handler as GET, handler as POST }
