import type {Request, Response} from 'express';
import {type LoginInput, type RegisterInput} from "../schemas/auth.schema.js";
import bcrypt from "bcrypt";
import {ConflictError, UnauthorizedError} from "../errors/AppError.js";
import prisma from "../lib/prisma.js";
import { Prisma } from '../../prisma/generated/client.js';
import {generateToken} from "../lib/jwt.js";

export const register = async (req: Request, res: Response) => {
  const registerData: RegisterInput = req.body;
  const hashedPassword = await bcrypt.hash(registerData.password, 10);
  let newUSer;

  try {
    newUSer = await prisma.user.create({
      data: {...registerData, password: hashedPassword, role: 'MEMBER'},
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('An account with this email already exists');
    }
    throw error;
  }


  const token = generateToken({ userId: newUSer.id, role: newUSer.role });
  const {id, name, email} = newUSer;
  res.status(201).json({ token, user: { id, name, email } });

}

export const login = async (req: Request, res: Response) => {
  const { email, password }: LoginInput = req.body;
  const user = await prisma.user.findUnique({where: {email}});
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = generateToken({ userId: user.id, role: user.role });
  const {id, name} = user;
  res.json({ token, user: { id, name, email } });
}
