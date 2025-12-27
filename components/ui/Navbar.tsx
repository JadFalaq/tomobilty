"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Shield, Trophy, User, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

type Props = { onOpenAuth: () => void };

export default function Navbar({ onOpenAuth }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<{ role?: string; prenom?: string } | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    try {
      setUser(JSON.parse(raw) as { role?: string; prenom?: string });
    } catch {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-[100] px-6 py-4">
      <div className="max-w-7xl mx-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-6 md:px-8 py-4 border-[#ff003c]/20 shadow-2xl">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3 cursor-pointer">
            <div className="hidden sm:block overflow-visible">
              <Image
                src="/logo_without_bg.png"
                alt="Tommobilty"
                width={160}
                height={64}
                className="h-10 w-auto origin-left scale-140 md:scale-180"
                priority
              />
            </div>
            <div className="sm:hidden bg-[#ff003c] p-1.5 rounded-lg rotate-12 shadow-[0_0_10px_#ff003c]">
              <Zap size={20} className="text-white" fill="white" />
            </div>
            <span className="sm:hidden text-2xl font-black italic tracking-tighter text-white">TOMMOBILTY</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
            <Link href="/" className={pathname === "/" ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}>
              Accueil
            </Link>
            <Link
              href="/voitures"
              className={pathname.startsWith("/voitures") ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}
            >
              Nos Voitures
            </Link>
            {user && (
              <>
                <Link
                  href="/mes-reservations"
                  className={pathname.startsWith("/mes-reservations") ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}
                >
                  Réservations
                </Link>
                <Link
                  href="/loyalty"
                  className={`flex items-center gap-2 ${pathname === "/loyalty" ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}`}
                >
                  <Trophy size={14} />
                  Fidélité
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2 ${pathname.startsWith("/admin") ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}`}
                  >
                    <Shield size={14} />
                    Admin
                  </Link>
                )}
                <Link
                  href="/profil"
                  className={`flex items-center gap-2 ${pathname === "/profil" ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}`}
                >
                  <User size={14} />
                  {user.prenom || "Profil"}
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 hover:text-[#ff003c] transition-colors">
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!user && (
              <button
                onClick={onOpenAuth}
                className="bg-white/5 hover:bg-white hover:text-black border border-white/10 px-6 py-2.5 rounded-xl text-xs font-black uppercase italic transition-all duration-300 flex items-center gap-2 group"
              >
                <User size={14} className="text-[#ff003c] group-hover:text-black" />
                <span>Connexion | Inscription</span>
              </button>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {!user && (
              <button
                onClick={onOpenAuth}
                className="bg-white/5 hover:bg-white hover:text-black border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic transition-all duration-300 flex items-center gap-2 group"
              >
                <User size={14} className="text-[#ff003c] group-hover:text-black" />
                <span>Connexion</span>
              </button>
            )}
            <button
              onClick={() => setIsMenuOpen((v) => !v)}
              className="bg-white/5 border border-white/10 p-3 rounded-xl text-white/80 hover:text-white hover:border-white/20 transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 border-t border-white/10 pt-4 flex flex-col gap-2 text-xs font-black uppercase tracking-[0.2em] text-white/70">
            <Link href="/" onClick={() => setIsMenuOpen(false)} className={pathname === "/" ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}>
              Accueil
            </Link>
            <Link
              href="/voitures"
              onClick={() => setIsMenuOpen(false)}
              className={pathname.startsWith("/voitures") ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}
            >
              Nos Voitures
            </Link>
            {user ? (
              <>
                <Link
                  href="/mes-reservations"
                  onClick={() => setIsMenuOpen(false)}
                  className={pathname.startsWith("/mes-reservations") ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}
                >
                  Réservations
                </Link>
                <Link
                  href="/loyalty"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 ${pathname === "/loyalty" ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}`}
                >
                  <Trophy size={14} />
                  Fidélité
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-2 ${pathname.startsWith("/admin") ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}`}
                  >
                    <Shield size={14} />
                    Admin
                  </Link>
                )}
                <Link
                  href="/profil"
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-2 ${pathname === "/profil" ? "text-[#ff003c]" : "hover:text-[#ff003c] transition-colors"}`}
                >
                  <User size={14} />
                  Profil
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 hover:text-[#ff003c] transition-colors text-left">
                  <LogOut size={14} />
                  Déconnexion
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenAuth();
                }}
                className="flex items-center gap-2 hover:text-[#ff003c] transition-colors text-left"
              >
                <User size={14} />
                Connexion | Inscription
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

