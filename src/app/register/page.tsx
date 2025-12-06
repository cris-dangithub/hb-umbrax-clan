"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { XCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        habboName: "",
        password: "",
        passwordConfirm: "",
        privacyConsent: false,
        rememberMe: false,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [habboAvatar, setHabboAvatar] = useState<string | null>(null);

    // Validar usuario en Habbo cuando se pierde el foco
    const handleHabboNameBlur = async () => {
        if (formData.habboName.length < 3) return;

        setIsValidating(true);
        setHabboAvatar(null);

        try {
            const avatarUrl = `https://www.habbo.es/habbo-imaging/avatarimage?user=${encodeURIComponent(
                formData.habboName
            )}&head_direction=3&size=l&action=wav`;

            const response = await fetch(avatarUrl, { method: "HEAD" });

            if (response.ok) {
                setHabboAvatar(avatarUrl);
                setErrors((prev) => ({ ...prev, habboName: "" }));
            } else {
                setErrors((prev) => ({
                    ...prev,
                    habboName: "Usuario no encontrado en Habbo Hotel",
                }));
            }
        } catch {
            setErrors((prev) => ({
                ...prev,
                habboName: "Error al verificar usuario",
            }));
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrors({});

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (data.details) {
                    // Errores de validación de Zod
                    const fieldErrors: Record<string, string> = {};
                    Object.entries(data.details).forEach(([key, value]) => {
                        fieldErrors[key] = (value as string[])[0];
                    });
                    setErrors(fieldErrors);
                } else if (data.field) {
                    setErrors({ [data.field]: data.error });
                } else {
                    setErrors({ general: data.error });
                }
                return;
            }

            // Registro exitoso
            router.push("/dashboard");
        } catch {
            setErrors({ general: "Error de conexión. Intenta nuevamente." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{ backgroundColor: "#0f0f0f" }}
        >
            {/* Contenedor principal con glassmorphism */}
            <div className="w-full max-w-md">
                <div
                    className="backdrop-blur-md rounded-lg shadow-2xl p-8"
                    style={{
                        backgroundColor: "rgba(15, 15, 15, 0.8)",
                        border: "2px solid #CC933B",
                    }}
                >
                    {/* Logo/Título */}
                    <h1
                        className="text-center text-2xl mb-8"
                        style={{
                            fontFamily: '"Press Start 2P", cursive',
                            color: "#CC933B",
                            textShadow: "0 0 10px rgba(204, 147, 59, 0.5)",
                        }}
                    >
                        UNIRSE A<br />
                        UMBRAX CLAN
                    </h1>

                    {/* Avatar Preview */}
                    {habboAvatar && (
                        <div className="flex justify-center mb-6">
                            <div
                                className="p-3 rounded-lg"
                                style={{
                                    backgroundColor: "rgba(74, 12, 17, 0.3)",
                                    border: "1px solid #CC933B",
                                }}
                            >
                                <Image
                                    src={habboAvatar}
                                    alt="Avatar Habbo"
                                    width={64}
                                    height={110}
                                />
                            </div>
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error general */}
                        {errors.general && (
                            <div
                                className="p-3 rounded text-sm flex items-center gap-2"
                                style={{
                                    backgroundColor: "#4A0C11",
                                    color: "#DC2626",
                                }}
                            >
                                <XCircle className="w-5 h-5 flex-shrink-0" />
                                <p>{errors.general}</p>
                            </div>
                        )}

                        {/* Habbo Name */}
                        <div>
                            <label
                                className="block text-sm mb-2"
                                style={{
                                    fontFamily: "Rajdhani, sans-serif",
                                    color: "#CC933B",
                                }}
                            >
                                Nombre de Usuario en Habbo
                            </label>
                            <input
                                type="text"
                                value={formData.habboName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        habboName: e.target.value,
                                    })
                                }
                                onBlur={handleHabboNameBlur}
                                className="w-full px-4 py-2 rounded bg-black/50 text-white"
                                style={{
                                    border: errors.habboName
                                        ? "2px solid #DC2626"
                                        : "1px solid #CC933B",
                                    fontFamily: "Rajdhani, sans-serif",
                                }}
                                disabled={isLoading}
                                required
                            />
                            {isValidating && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Loader2
                                        className="w-4 h-4 animate-spin"
                                        style={{ color: "#CC933B" }}
                                    />
                                    <p
                                        className="text-xs"
                                        style={{ color: "#CC933B" }}
                                    >
                                        Validando usuario en Habbo...
                                    </p>
                                </div>
                            )}
                            {errors.habboName && (
                                <div className="flex items-center gap-1 mt-1">
                                    <XCircle
                                        className="w-4 h-4"
                                        style={{ color: "#DC2626" }}
                                    />
                                    <p
                                        className="text-xs font-semibold"
                                        style={{ color: "#DC2626" }}
                                    >
                                        {errors.habboName}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label
                                className="block text-sm mb-2"
                                style={{
                                    fontFamily: "Rajdhani, sans-serif",
                                    color: "#CC933B",
                                }}
                            >
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        password: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 rounded bg-black/50 text-white"
                                style={{
                                    border: errors.password
                                        ? "2px solid #DC2626"
                                        : "1px solid #CC933B",
                                    fontFamily: "Rajdhani, sans-serif",
                                }}
                                disabled={isLoading}
                                placeholder="Mínimo 8 caracteres"
                                required
                            />
                            <p
                                className="text-xs mt-1"
                                style={{ color: "#CC933B" }}
                            >
                                ⚠️ Recomendación de seguridad: No uses tu
                                contraseña de Habbo
                            </p>
                            {errors.password && (
                                <div className="flex items-center gap-1 mt-1">
                                    <XCircle
                                        className="w-4 h-4"
                                        style={{ color: "#DC2626" }}
                                    />
                                    <p
                                        className="text-xs font-semibold"
                                        style={{ color: "#DC2626" }}
                                    >
                                        {errors.password}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Password Confirm */}
                        <div>
                            <label
                                className="block text-sm mb-2"
                                style={{
                                    fontFamily: "Rajdhani, sans-serif",
                                    color: "#CC933B",
                                }}
                            >
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        passwordConfirm: e.target.value,
                                    })
                                }
                                className="w-full px-4 py-2 rounded bg-black/50 text-white"
                                style={{
                                    border: errors.passwordConfirm
                                        ? "2px solid #DC2626"
                                        : "1px solid #CC933B",
                                    fontFamily: "Rajdhani, sans-serif",
                                }}
                                disabled={isLoading}
                                placeholder="Repite la contraseña"
                                required
                            />
                            {errors.passwordConfirm && (
                                <div className="flex items-center gap-1 mt-1">
                                    <XCircle
                                        className="w-4 h-4"
                                        style={{ color: "#DC2626" }}
                                    />
                                    <p
                                        className="text-xs font-semibold"
                                        style={{ color: "#DC2626" }}
                                    >
                                        {errors.passwordConfirm}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Privacy Consent */}
                        <div className="flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="privacy"
                                checked={formData.privacyConsent}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        privacyConsent: e.target.checked,
                                    })
                                }
                                className="mt-1"
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="privacy"
                                className="text-sm"
                                style={{
                                    fontFamily: "Rajdhani, sans-serif",
                                    color: "#CC933B",
                                }}
                            >
                                Acepto la{" "}
                                <Link
                                    href="/privacy"
                                    target="_blank"
                                    className="underline hover:text-white"
                                >
                                    Política de Privacidad
                                </Link>
                            </label>
                        </div>
                        {errors.privacyConsent && (
                            <div className="flex items-center gap-1">
                                <XCircle
                                    className="w-4 h-4"
                                    style={{ color: "#DC2626" }}
                                />
                                <p
                                    className="text-xs font-semibold"
                                    style={{ color: "#DC2626" }}
                                >
                                    {errors.privacyConsent}
                                </p>
                            </div>
                        )}

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={formData.rememberMe}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        rememberMe: e.target.checked,
                                    })
                                }
                                disabled={isLoading}
                            />
                            <label
                                htmlFor="remember"
                                className="text-sm"
                                style={{
                                    fontFamily: "Rajdhani, sans-serif",
                                    color: "#CC933B",
                                }}
                            >
                                Mantener sesión iniciada
                            </label>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || isValidating}
                            className="w-full py-3 rounded font-bold text-black transition-all hover:scale-105"
                            style={{
                                backgroundColor: "#CC933B",
                                fontFamily: "Rajdhani, sans-serif",
                                fontSize: "18px",
                                border: "2px solid #CC933B",
                            }}
                        >
                            {isLoading ? "REGISTRANDO..." : "UNIRSE AL CLAN"}
                        </button>
                    </form>

                    {/* Link a Login */}
                    <p
                        className="text-center mt-6 text-sm"
                        style={{
                            fontFamily: "Rajdhani, sans-serif",
                            color: "#CC933B",
                        }}
                    >
                        ¿Ya eres miembro?{" "}
                        <Link
                            href="/login"
                            className="underline hover:text-white"
                        >
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
