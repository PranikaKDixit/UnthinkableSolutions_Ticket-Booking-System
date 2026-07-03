  import bcrypt from "bcrypt";
  import { prisma } from "../../lib/prisma";
  import { signToken } from "../../lib/jwt";
  import { HttpError } from "../../lib/httpError";
  import { RegisterInput, LoginInput } from "./auth.schema";

  function sanitize(user: { passwordHash: string; [k: string]: unknown }) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  export async function registerUser(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new HttpError(409, "Email already registered");

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, role: input.role },
    });

    const token = signToken({ userId: user.id, role: user.role });
    return { user: sanitize(user), token };
  }

  export async function loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    const token = signToken({ userId: user.id, role: user.role });
    return { user: sanitize(user), token };
  }