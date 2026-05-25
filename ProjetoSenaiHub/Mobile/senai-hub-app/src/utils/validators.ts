import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'E-mail é obrigatório')
  .email('E-mail inválido');

export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no mínimo 6 caracteres');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const recuperarSenhaSchema = z.object({
  email: emailSchema,
});

export const redefinirSenhaSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RecuperarSenhaFormData = z.infer<typeof recuperarSenhaSchema>;
export type RedefinirSenhaFormData = z.infer<typeof redefinirSenhaSchema>;
