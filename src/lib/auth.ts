import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/firebase/Index";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          const user = userCredential.user;
          const q = query(
            collection(db, "employee"),
            where("email", "==", user.email)
          );

          let employeeId = "";
          let permissionsIds = [];
          const querySnapshot = await getDocs(q);

          querySnapshot.forEach((doc2) => {
            // doc.data() is never undefined for query doc snapshots
            console.log(doc2.id, " => ", doc2.data());
            employeeId = doc2.id;
          });
          const permissionsRef = doc(
            db,
            `employee/${employeeId}/permissions`,
            "user_permissions"
          );
          const permissionsSnapshot = await getDoc(permissionsRef);
          if (permissionsSnapshot.exists()) {
            // Si el documento existe, obtener los permisos
            const permissionsData = permissionsSnapshot.data();
            if (permissionsData && permissionsData.permissionIds) {
              permissionsIds = permissionsData.permissionIds;
            }
          }
          console.log("Permissions IDs:", permissionsIds);
          
          return {
            id: user.uid,
            email: user.email ?? "",
            name: user.displayName ?? user.email ?? "",
            image: user.photoURL ?? "",
            permissionsIds,
            test: "test",
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/access-denied",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.permissionsIds = user.permissionsIds;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.permissionsIds = token.permissionsIds as string[];
      }
      return session;
    },
  },
};
